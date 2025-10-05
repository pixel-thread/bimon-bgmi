// lib/__tests__/validation.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Validator,
  ValidationRules,
  validateEmail,
  validatePassword,
  validatePlayerName,
  validatePollQuestion,
  validatePollOption,
  LoginValidationSchemas,
  PollValidationSchemas,
  PlayerValidationSchemas,
} from "../validation";

describe("Validation", () => {
  describe("Validator.validateField", () => {
    it("should validate required fields", () => {
      const result = Validator.validateField(
        "",
        { required: true },
        "Test Field"
      );
      expect(result).toBe("Test Field is required");
    });

    it("should pass validation for non-required empty fields", () => {
      const result = Validator.validateField(
        "",
        { required: false },
        "Test Field"
      );
      expect(result).toBeNull();
    });

    it("should validate minimum length", () => {
      const result = Validator.validateField(
        "ab",
        { minLength: 3 },
        "Test Field"
      );
      expect(result).toBe("Test Field must be at least 3 characters long");
    });

    it("should validate maximum length", () => {
      const result = Validator.validateField(
        "abcdef",
        { maxLength: 5 },
        "Test Field"
      );
      expect(result).toBe("Test Field must be no more than 5 characters long");
    });

    it("should validate pattern", () => {
      const result = Validator.validateField(
        "invalid-email",
        { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        "Email"
      );
      expect(result).toBe("Email format is invalid");
    });

    it("should validate with custom function", () => {
      const customRule = {
        custom: (value: string) =>
          value === "forbidden" ? "Value is forbidden" : null,
      };

      const result = Validator.validateField(
        "forbidden",
        customRule,
        "Test Field"
      );
      expect(result).toBe("Value is forbidden");
    });

    it("should pass all validations", () => {
      const result = Validator.validateField(
        "test@example.com",
        {
          required: true,
          minLength: 5,
          maxLength: 50,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        "Email"
      );

      expect(result).toBeNull();
    });
  });

  describe("Validator.validateForm", () => {
    it("should validate entire form and return errors", () => {
      const data = {
        email: "invalid-email",
        password: "123",
      };

      const schema = {
        email: ValidationRules.email,
        password: ValidationRules.password,
      };

      const result = Validator.validateForm(data, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("email format is invalid");
      expect(result.errors.password).toBe(
        "password must be at least 6 characters long"
      );
      expect(result.firstError).toBe("email format is invalid");
    });

    it("should return valid result for correct data", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
      };

      const schema = {
        email: ValidationRules.email,
        password: ValidationRules.password,
      };

      const result = Validator.validateForm(data, schema);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.firstError).toBeUndefined();
    });
  });

  describe("Validator.validateFieldRealTime", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should debounce validation", async () => {
      const promise = Validator.validateFieldRealTime(
        "",
        { required: true },
        "Test Field",
        100
      );

      vi.advanceTimersByTime(100);

      const result = await promise;
      expect(result).toBe("Test Field is required");
    });
  });

  describe("Specific validation functions", () => {
    describe("validateEmail", () => {
      it("should validate correct email", () => {
        expect(validateEmail("test@example.com")).toBeNull();
      });

      it("should reject invalid email", () => {
        expect(validateEmail("invalid-email")).toBe("Email format is invalid");
      });

      it("should reject empty email", () => {
        expect(validateEmail("")).toBe("Email is required");
      });
    });

    describe("validatePassword", () => {
      it("should validate correct password", () => {
        expect(validatePassword("password123")).toBeNull();
      });

      it("should reject short password", () => {
        expect(validatePassword("123")).toBe(
          "Password must be at least 6 characters long"
        );
      });

      it("should reject empty password", () => {
        expect(validatePassword("")).toBe("Password is required");
      });
    });

    describe("validatePlayerName", () => {
      it("should validate correct player name", () => {
        expect(validatePlayerName("Player123")).toBeNull();
      });

      it("should reject short name", () => {
        expect(validatePlayerName("A")).toBe(
          "Player name must be at least 2 characters long"
        );
      });

      it("should reject long name", () => {
        const longName = "A".repeat(51);
        expect(validatePlayerName(longName)).toBe(
          "Player name must be no more than 50 characters long"
        );
      });

      it("should accept special characters like PUBG Mobile", () => {
        expect(validatePlayerName("Player@#$")).toBeNull();
        expect(validatePlayerName("King☆彡"))
          .toBeNull();
        expect(validatePlayerName("𝑷𝑼𝑩𝑮•Pro"))
          .toBeNull();
        expect(validatePlayerName("Player_123-Test.Name"))
          .toBeNull();
      });
    });

    describe("validatePollQuestion", () => {
      it("should validate correct question", () => {
        expect(
          validatePollQuestion("This is a valid poll question?")
        ).toBeNull();
      });

      it("should reject short question", () => {
        expect(validatePollQuestion("Short?")).toBe(
          "Poll question must be at least 10 characters long"
        );
      });

      it("should reject long question", () => {
        const longQuestion = "A".repeat(501);
        expect(validatePollQuestion(longQuestion)).toBe(
          "Poll question must be no more than 500 characters long"
        );
      });
    });

    describe("validatePollOption", () => {
      it("should validate correct option", () => {
        expect(validatePollOption("Yes")).toBeNull();
      });

      it("should reject empty option", () => {
        expect(validatePollOption("")).toBe("Poll option is required");
      });

      it("should reject long option", () => {
        const longOption = "A".repeat(101);
        expect(validatePollOption(longOption)).toBe(
          "Poll option must be no more than 100 characters long"
        );
      });
    });
  });

  describe("Validation schemas", () => {
    describe("LoginValidationSchemas", () => {
      it("should have admin login schema", () => {
        expect(LoginValidationSchemas.adminLogin).toHaveProperty("email");
        expect(LoginValidationSchemas.adminLogin).toHaveProperty("password");
      });

      it("should have player login schema", () => {
        expect(LoginValidationSchemas.playerLogin).toHaveProperty("playerName");
        expect(LoginValidationSchemas.playerLogin).toHaveProperty("password");
      });

      it("should have password reset schema", () => {
        expect(LoginValidationSchemas.passwordReset).toHaveProperty("email");
      });
    });

    describe("PollValidationSchemas", () => {
      it("should have create poll schema", () => {
        expect(PollValidationSchemas.createPoll).toHaveProperty("question");
        expect(PollValidationSchemas.createPoll).toHaveProperty("type");
      });

      it("should have poll option schema", () => {
        expect(PollValidationSchemas.pollOption).toHaveProperty("option");
      });
    });

    describe("PlayerValidationSchemas", () => {
      it("should have create player schema", () => {
        expect(PlayerValidationSchemas.createPlayer).toHaveProperty("name");
        expect(PlayerValidationSchemas.createPlayer).toHaveProperty("password");
        expect(PlayerValidationSchemas.createPlayer).toHaveProperty("category");
      });

      it("should have update password schema", () => {
        expect(PlayerValidationSchemas.updatePassword).toHaveProperty(
          "password"
        );
      });
    });
  });

  describe("ValidationRules", () => {
    it("should have email rule", () => {
      expect(ValidationRules.email).toHaveProperty("required", true);
      expect(ValidationRules.email).toHaveProperty("pattern");
    });

    it("should have password rule", () => {
      expect(ValidationRules.password).toHaveProperty("required", true);
      expect(ValidationRules.password).toHaveProperty("minLength", 6);
    });

    it("should have player name rule", () => {
      expect(ValidationRules.playerName).toHaveProperty("required", true);
      expect(ValidationRules.playerName).toHaveProperty("minLength", 2);
      expect(ValidationRules.playerName).toHaveProperty("maxLength", 50);
      expect(ValidationRules.playerName).toHaveProperty("pattern");
    });

    it("should have poll question rule", () => {
      expect(ValidationRules.pollQuestion).toHaveProperty("required", true);
      expect(ValidationRules.pollQuestion).toHaveProperty("minLength", 10);
      expect(ValidationRules.pollQuestion).toHaveProperty("maxLength", 500);
    });

    it("should have non-empty rule with custom validation", () => {
      expect(ValidationRules.nonEmpty).toHaveProperty("required", true);
      expect(ValidationRules.nonEmpty).toHaveProperty("custom");

      const customFn = ValidationRules.nonEmpty.custom!;
      expect(customFn("   ")).toBe("This field cannot be empty");
      expect(customFn("valid")).toBeNull();
    });
  });
});
