import cors from 'cors'

/**
 * Custom origin validation function that allows *.hanzo.ai domains
 * without using wildcards for better security
 */
function isAllowedDomain(origin: string): boolean {
    // Allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
        return true
    }

    // Check if the origin ends with .hanzo.ai
    return origin.endsWith('.hanzo.ai')
}

/**
 * CORS configuration that allows *.hanzo.ai domains
 */
export const corsMiddleware = cors({
    origin: (origin: string | undefined, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true)
        }

        if (isAllowedDomain(origin)) {
            return callback(null, true)
        }

        // Reject other origins
        return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})
