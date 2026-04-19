import colors from 'colors'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import app from './app'
import config from './config'
import { errorLogger, logger } from './shared/logger'
import { socketHelper } from './helpers/socketHelper'
import { seedSuperAdmin } from './DB/seed'

// Handle unexpected errors that weren't caught by any try-catch block
process.on('uncaughtException', error => {
    errorLogger.error('UnhandledException Detected', error)
    process.exit(1)
})

export const onlineUsers = new Map()
let server: any

// Connect to the database and start the express server
async function main() {
    try {
        await mongoose.connect(config.database_url as string)
        logger.info(colors.green('🚀 Database connected successfully'))

        // Initialize the super admin account if it doesn't already exist
        await seedSuperAdmin()

        const port = typeof config.port === 'number' ? config.port : Number(config.port)

        server = app.listen(port, config.ip_address as string, () => {
            logger.info(colors.yellow(`♻️  Application listening on port:${config.port}`))
        })

        // Set up socket.io for real-time communication
        const io = new Server(server, {
            pingTimeout: 60000,
            cors: {
                origin: '*',
            },
        })

        logger.info(colors.green('🍁 Server connected successfully'))

        socketHelper.socket(io)
        //@ts-ignore
        global.io = io
    } catch (error) {
        errorLogger.error(colors.red('Server Failed to connect Database'))
        config.node_env === 'development' && console.log(error)
    }

    // Handle promise rejections that aren't caught locally
    process.on('unhandledRejection', error => {
        if (server) {
            server.close(() => {
                errorLogger.error('UnhandledRejection Detected', error)
                process.exit(1)
            })
        } else {
            process.exit(1)
        }
    })
}

main()

// Gracefully shut down the server when receiving a termination signal
process.on('SIGTERM', async () => {
    logger.info('SIGTERM IS RECEIVE')
    if (server) {
        server.close()
    }
})


