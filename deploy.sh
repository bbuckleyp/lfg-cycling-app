#!/bin/bash

# LFG Cycling App Deployment Script
# This script helps deploy the application to a production server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
COMMAND=""
BACKUP_DB=false

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  start          Start the application"
    echo "  stop           Stop the application"
    echo "  restart        Restart the application"
    echo "  logs           Show application logs"
    echo "  backup         Backup the database"
    echo "  migrate        Run database migrations"
    echo "  build          Build Docker images"
    echo "  pull           Pull latest code and rebuild"
    echo "  status         Show service status"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV     Environment (development|production) [default: development]"
    echo "  -b, --backup      Create database backup before operations"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start in development mode"
    echo "  $0 -e production start      # Start in production mode"
    echo "  $0 -e production -b pull    # Pull updates and backup DB first"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -b|--backup)
            BACKUP_DB=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        start|stop|restart|logs|backup|migrate|build|pull|status)
            COMMAND="$1"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}" >&2
            show_help
            exit 1
            ;;
    esac
done

# Validate command
if [[ -z "$COMMAND" ]]; then
    echo -e "${RED}Error: No command specified${NC}" >&2
    show_help
    exit 1
fi

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}Error: Environment must be 'development' or 'production'${NC}" >&2
    exit 1
fi

# Set Docker Compose file based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env"
fi

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}Error: Environment file $ENV_FILE not found${NC}" >&2
    echo -e "${YELLOW}Please copy ${ENV_FILE}.example to ${ENV_FILE} and configure it${NC}" >&2
    exit 1
fi

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup
create_backup() {
    if [[ "$BACKUP_DB" == true ]]; then
        log_info "Creating database backup..."
        local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres pg_dump -U lfg_user lfg_cycling > "$backup_file"
        log_info "Database backup created: $backup_file"
    fi
}

# Check Docker and Docker Compose
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Use docker compose if available, fallback to docker-compose
    if command -v docker compose &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
}

# Main commands
cmd_start() {
    log_info "Starting LFG Cycling App in $ENVIRONMENT mode..."
    create_backup
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    log_info "Application started successfully!"
    log_info "Frontend: ${FRONTEND_URL:-http://localhost:3000}"
    log_info "Backend API: ${VITE_API_BASE_URL:-http://localhost:5000/api}"
}

cmd_stop() {
    log_info "Stopping LFG Cycling App..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    log_info "Application stopped successfully!"
}

cmd_restart() {
    log_info "Restarting LFG Cycling App..."
    create_backup
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
    log_info "Application restarted successfully!"
}

cmd_logs() {
    log_info "Showing application logs (Ctrl+C to exit)..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
}

cmd_backup() {
    log_info "Creating database backup..."
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres pg_dump -U lfg_user lfg_cycling > "$backup_file"
    log_info "Database backup created: $backup_file"
}

cmd_migrate() {
    log_info "Running database migrations..."
    create_backup
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec backend npx prisma migrate deploy
    log_info "Database migrations completed!"
}

cmd_build() {
    log_info "Building Docker images..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    log_info "Docker images built successfully!"
}

cmd_pull() {
    log_info "Pulling latest code and rebuilding..."
    create_backup
    
    # Pull latest code (if in git repo)
    if [[ -d ".git" ]]; then
        log_info "Pulling latest code from git..."
        git pull
    fi
    
    # Rebuild and restart
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    log_info "Application updated and restarted successfully!"
}

cmd_status() {
    log_info "Checking service status..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

# Check dependencies
check_dependencies

# Execute command
case $COMMAND in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    logs)
        cmd_logs
        ;;
    backup)
        cmd_backup
        ;;
    migrate)
        cmd_migrate
        ;;
    build)
        cmd_build
        ;;
    pull)
        cmd_pull
        ;;
    status)
        cmd_status
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        exit 1
        ;;
esac