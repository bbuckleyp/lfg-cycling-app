-- LFG Cycling App Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    strava_user_id BIGINT UNIQUE,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    profile_photo_url TEXT,
    location VARCHAR(255),
    bike_type VARCHAR(50),
    experience_level VARCHAR(20) CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table (imported from Strava)
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    strava_route_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    distance_meters INTEGER NOT NULL,
    elevation_gain_meters INTEGER,
    polyline TEXT, -- encoded polyline from Strava
    map_image_url TEXT,
    estimated_moving_time INTEGER, -- in seconds
    difficulty_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides table
CREATE TABLE rides (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    start_time TIME NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    pace VARCHAR(20) NOT NULL CHECK (pace IN ('social', 'tempo', 'race')),
    max_participants INTEGER,
    is_public BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RSVPs table
CREATE TABLE rsvps (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, user_id)
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ride_reminder', 'ride_updated', 'ride_cancelled', 'new_participant', 'participant_left')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    send_at TIMESTAMP, -- When to send the notification (for reminders)
    sent_at TIMESTAMP, -- When the notification was actually sent
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_rides_start_date ON rides(start_date);
CREATE INDEX idx_rides_organizer ON rides(organizer_id);
CREATE INDEX idx_rides_route ON rides(route_id);
CREATE INDEX idx_rsvps_ride ON rsvps(ride_id);
CREATE INDEX idx_rsvps_user ON rsvps(user_id);
CREATE INDEX idx_users_strava ON users(strava_user_id);
CREATE INDEX idx_routes_strava ON routes(strava_route_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_ride ON notifications(ride_id);
CREATE INDEX idx_notifications_send_at ON notifications(send_at);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;