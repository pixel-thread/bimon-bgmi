/**
 * Production Logger with Axiom Integration
 * 
 * Free tier: 500MB/month, 30 day retention
 * Setup: Add AXIOM_TOKEN and AXIOM_DATASET to your environment
 */

import { Axiom } from '@axiomhq/js';

// Initialize Axiom client if token is available
const axiom = process.env.AXIOM_TOKEN
    ? new Axiom({
        token: process.env.AXIOM_TOKEN,
    })
    : null;

const DATASET = process.env.AXIOM_DATASET || 'bimon-logs';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    [key: string]: unknown;
}

/**
 * Send log to Axiom (async, non-blocking)
 */
async function sendToAxiom(level: LogLevel, category: string, message: string, context?: LogContext) {
    if (!axiom) return;

    try {
        axiom.ingest(DATASET, [{
            _time: new Date().toISOString(),
            level,
            category,
            message,
            ...context,
            env: process.env.NODE_ENV || 'development',
        }]);
        // Flush in background (don't await in production for performance)
        axiom.flush().catch(() => { /* ignore flush errors */ });
    } catch (e) {
        // Silently fail - don't let logging break the app
    }
}

/**
 * Logger utility with structured output
 */
export const logger = {
    info: (category: string, message: string, context?: LogContext) => {
        const prefix = `[${category}]`;
        console.log(prefix, message, context ? JSON.stringify(context) : '');
        sendToAxiom('info', category, message, context);
    },

    warn: (category: string, message: string, context?: LogContext) => {
        const prefix = `[${category}]`;
        console.warn(prefix, message, context ? JSON.stringify(context) : '');
        sendToAxiom('warn', category, message, context);
    },

    error: (category: string, message: string, context?: LogContext) => {
        const prefix = `[${category}]`;
        console.error(prefix, message, context ? JSON.stringify(context) : '');
        sendToAxiom('error', category, message, context);
    },

    debug: (category: string, message: string, context?: LogContext) => {
        if (process.env.NODE_ENV === 'development') {
            const prefix = `[${category}]`;
            console.debug(prefix, message, context ? JSON.stringify(context) : '');
        }
        sendToAxiom('debug', category, message, context);
    },

    // Specialized team generation logging
    teamGen: {
        start: (pollId: string, teamType: string, eligibleCount: number) => {
            logger.info('TEAM_GEN', 'Team generation started', { pollId, teamType, eligibleCount });
        },
        complete: (pollId: string, teamsCreated: number, playersIncluded: number) => {
            logger.info('TEAM_GEN', 'Team generation complete', { pollId, teamsCreated, playersIncluded });
        },
        missingPlayers: (pollId: string, missing: string[]) => {
            logger.warn('TEAM_GEN', 'Players missing from generated teams', { pollId, missing, count: missing.length });
        },
        error: (pollId: string, error: string) => {
            logger.error('TEAM_GEN', 'Team generation failed', { pollId, error });
        },
    },
};

export default logger;
