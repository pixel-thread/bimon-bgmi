// lib/validation.ts
import { createValidationError } from "./errorHandling";

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
}

// Field validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

// Form validation schema
export type ValidationSchema = Record<string, ValidationRule>;

// Validation utility class
export class Validator {
  // Validate a single field
  static validateField(
    value: any,
    rules: ValidationRule,
    fieldName: string
  ): string | null {
    // Required validation
    if (
      rules.required &&
      (value === null || value === undefined || value === "")
    ) {
      return `${fieldName} is required`;
    }

    // Skip other validations if field is empty and not required
    if (
      !rules.required &&
      (value === null || value === undefined || value === "")
    ) {
      return null;
    }

    const stringValue = String(value);

    // Min length validation
    if (rules.minLength && stringValue.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters long`;
    }

    // Max length validation
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return `${fieldName} must be no more than ${rules.maxLength} characters long`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return `${fieldName} format is invalid`;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  // Validate entire form
  static validateForm(
    data: Record<string, any>,
    schema: ValidationSchema
  ): ValidationResult {
    const errors: Record<string, string> = {};
    let firstError: string | undefined;

    for (const [fieldName, rules] of Object.entries(schema)) {
      const value = data[fieldName];
      const error = this.validateField(value, rules, fieldName);

      if (error) {
        errors[fieldName] = error;
        if (!firstError) {
          firstError = error;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstError,
    };
  }

  // Real-time field validation
  static validateFieldRealTime(
    value: any,
    rules: ValidationRule,
    fieldName: string,
    debounceMs: number = 300
  ): Promise<string | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const error = this.validateField(value, rules, fieldName);
        resolve(error);
      }, debounceMs);
    });
  }
}

// Common validation rules
export const ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 6,
  },
  playerName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    // Allow letters, numbers, marks, punctuation, symbols, and spaces (similar to PUBG Mobile display names)
    // Disallow control characters. Unicode-enabled.
    pattern: /^[\p{L}\p{N}\p{M}\p{Pc}\p{Pd}\p{Po}\p{S}\s]+$/u,
  },
  pollQuestion: {
    required: true,
    minLength: 10,
    maxLength: 500,
  },
  pollOption: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  phoneNumber: {
    pattern: /^\+?[\d\s-()]+$/,
  },
  required: {
    required: true,
  },
  nonEmpty: {
    required: true,
    custom: (value: string) => {
      if (typeof value === "string" && value.trim().length === 0) {
        return "This field cannot be empty";
      }
      return null;
    },
  },
};

// Specific validation functions
export const validateEmail = (email: string): string | null => {
  return Validator.validateField(email, ValidationRules.email, "Email");
};

export const validatePassword = (password: string): string | null => {
  return Validator.validateField(
    password,
    ValidationRules.password,
    "Password"
  );
};

export const validatePlayerName = (name: string): string | null => {
  return Validator.validateField(
    name,
    ValidationRules.playerName,
    "Player name"
  );
};

export const validatePollQuestion = (question: string): string | null => {
  return Validator.validateField(
    question,
    ValidationRules.pollQuestion,
    "Poll question"
  );
};

export const validatePollOption = (option: string): string | null => {
  return Validator.validateField(
    option,
    ValidationRules.pollOption,
    "Poll option"
  );
};

// Login form validation schemas
export const LoginValidationSchemas = {
  adminLogin: {
    email: ValidationRules.email,
    password: ValidationRules.password,
  },
  playerLogin: {
    playerName: ValidationRules.playerName,
    password: ValidationRules.password,
  },
  passwordReset: {
    email: ValidationRules.email,
  },
};

// Poll management validation schemas
export const PollValidationSchemas = {
  createPoll: {
    question: ValidationRules.pollQuestion,
    type: ValidationRules.required,
  },
  pollOption: {
    option: ValidationRules.pollOption,
  },
};

// Player management validation schemas
export const PlayerValidationSchemas = {
  createPlayer: {
    name: ValidationRules.playerName,
    password: ValidationRules.password,
    category: ValidationRules.required,
  },
  updatePassword: {
    password: ValidationRules.password,
  },
};

// Custom validation hooks for React components
export const useFormValidation = (schema: ValidationSchema) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = React.useState(false);

  const validateField = React.useCallback(
    async (fieldName: string, value: any) => {
      if (!schema[fieldName]) return;

      setIsValidating(true);

      try {
        const error = await Validator.validateFieldRealTime(
          value,
          schema[fieldName],
          fieldName
        );

        setErrors((prev) => ({
          ...prev,
          [fieldName]: error || "",
        }));
      } finally {
        setIsValidating(false);
      }
    },
    [schema]
  );

  const validateForm = React.useCallback(
    (data: Record<string, any>) => {
      const result = Validator.validateForm(data, schema);
      setErrors(result.errors);
      return result;
    },
    [schema]
  );

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = React.useCallback((fieldName: string) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  }, []);

  return {
    errors,
    isValidating,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors: Object.values(errors).some((error) => error !== ""),
  };
};

// Import React for the hook (this would normally be at the top)
import React from "react";
