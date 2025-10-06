module.exports = {
  apps: [
    {
      name: 'merlin-backend',
      script: 'server/index.cjs',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      log_file: './logs/backend.log',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      restart_delay: 1000,
      max_restarts: 10
    },
    {
      name: 'merlin-frontend',
      script: 'npm',
      args: 'run dev',
      watch: false,
      env: {
        NODE_ENV: 'development'
      },
      log_file: './logs/frontend.log',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      restart_delay: 1000,
      max_restarts: 10
    }
  ]
};