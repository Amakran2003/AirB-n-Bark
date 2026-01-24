-- =============================================
-- AIRBNBARK DATABASE INITIALIZATION SCRIPT
-- =============================================

-- =============================================
-- TABLES
-- =============================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    pseudo VARCHAR(70) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Hosts table
CREATE TABLE hosts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    star_count NUMERIC(4,3) DEFAULT 0,
    woofviews_count INT DEFAULT 0,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Doghouse types table
CREATE TABLE doghouse_types (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500)
);

-- Options table
CREATE TABLE options (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500)
);

-- Doghouses table
CREATE TABLE doghouses (
    id SERIAL PRIMARY KEY,
    host_id INT NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
    type_id SMALLINT NOT NULL REFERENCES doghouse_types(id),
    price SMALLINT NOT NULL CHECK (price > 0),
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    bed_count SMALLINT NOT NULL CHECK (bed_count >= 0),
    dog_count SMALLINT NOT NULL CHECK (dog_count >= 0),
    doghouse_count SMALLINT NOT NULL CHECK (doghouse_count >= 0),
    bowl_area_count SMALLINT NOT NULL CHECK (bowl_area_count >= 0),
    woofviews_count INT NOT NULL DEFAULT 0,
    star_count NUMERIC(4,3) NOT NULL DEFAULT 0,
    description VARCHAR(1000),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Doghouse options (junction table)
CREATE TABLE doghouse_options (
    id SERIAL PRIMARY KEY,
    doghouse_id INT NOT NULL REFERENCES doghouses(id) ON DELETE CASCADE,
    option_id SMALLINT NOT NULL REFERENCES options(id) ON DELETE CASCADE,

    CONSTRAINT unique_doghouse_option UNIQUE (doghouse_id, option_id)
);

-- Doghouse images table
CREATE TABLE doghouse_images (
    id SERIAL PRIMARY KEY,
    doghouse_id INT NOT NULL REFERENCES doghouses(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    position SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    doghouse_id INT NOT NULL REFERENCES doghouses(id) ON DELETE CASCADE,
    guest_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_price INT NOT NULL CHECK (total_price > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- Comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    doghouse_id INT NOT NULL REFERENCES doghouses(id) ON DELETE CASCADE,
    woofviewer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
    star_count SMALLINT NOT NULL CHECK (star_count BETWEEN 1 AND 5),
    comment VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Catchphrases table
CREATE TABLE catchphrases (
    id SMALLSERIAL PRIMARY KEY,
    catchphrase VARCHAR(255) NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

-- Users
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL AND deleted_at IS NULL;

-- Hosts
CREATE INDEX idx_hosts_user_id ON hosts(user_id);
CREATE INDEX idx_hosts_star_count ON hosts(star_count DESC);

-- Doghouses
CREATE INDEX idx_doghouses_host_id ON doghouses(host_id);
CREATE INDEX idx_doghouses_type_id ON doghouses(type_id);
CREATE INDEX idx_doghouses_location ON doghouses(country, city);
CREATE INDEX idx_doghouses_price ON doghouses(price);
CREATE INDEX idx_doghouses_star_count ON doghouses(star_count DESC);
CREATE INDEX idx_doghouses_active ON doghouses(id) WHERE deleted_at IS NULL;

-- Bookings
CREATE INDEX idx_bookings_doghouse_id ON bookings(doghouse_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(doghouse_id, check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Comments
CREATE INDEX idx_comments_doghouse_id ON comments(doghouse_id);
CREATE INDEX idx_comments_woofviewer_id ON comments(woofviewer_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_active ON comments(doghouse_id) WHERE deleted_at IS NULL;

-- Doghouse options
CREATE INDEX idx_doghouse_options_doghouse_id ON doghouse_options(doghouse_id);
CREATE INDEX idx_doghouse_options_option_id ON doghouse_options(option_id);

-- Doghouse images
CREATE INDEX idx_doghouse_images_doghouse_id ON doghouse_images(doghouse_id);
CREATE INDEX idx_doghouse_images_position ON doghouse_images(doghouse_id, position);

-- =============================================
-- FUNCTION:  AUTO-UPDATE updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_hosts_updated_at
    BEFORE UPDATE ON hosts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_doghouses_updated_at
    BEFORE UPDATE ON doghouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGERS FOR DENORMALIZED STATS
-- =============================================

-- Function to update doghouse stats after comment changes
CREATE OR REPLACE FUNCTION update_doghouse_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_doghouse_id INT;
BEGIN
    -- Determine which doghouse_id to update
    IF TG_OP = 'DELETE' THEN
        target_doghouse_id := OLD.doghouse_id;
    ELSE
        target_doghouse_id := NEW.doghouse_id;
    END IF;

    -- Update the doghouse stats (only count non-deleted comments)
    UPDATE doghouses SET
        woofviews_count = (
            SELECT COUNT(*)
            FROM comments
            WHERE doghouse_id = target_doghouse_id
            AND deleted_at IS NULL
        ),
        star_count = (
            SELECT COALESCE(AVG(star_count), 0)
            FROM comments
            WHERE doghouse_id = target_doghouse_id
            AND deleted_at IS NULL
        )
    WHERE id = target_doghouse_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments
CREATE TRIGGER trg_comments_stats
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_doghouse_stats();

-- Function to update host stats (aggregated from their doghouses)
CREATE OR REPLACE FUNCTION update_host_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_host_id INT;
BEGIN
    -- Get the host_id for the affected doghouse
    SELECT host_id INTO target_host_id
    FROM doghouses
    WHERE id = NEW.id;

    -- Update host stats (only count non-deleted doghouses)
    UPDATE hosts SET
        woofviews_count = (
            SELECT COALESCE(SUM(woofviews_count), 0)
            FROM doghouses
            WHERE host_id = target_host_id
            AND deleted_at IS NULL
        ),
        star_count = (
            SELECT COALESCE(AVG(star_count), 0)
            FROM doghouses
            WHERE host_id = target_host_id
            AND woofviews_count > 0
            AND deleted_at IS NULL
        )
    WHERE id = target_host_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for doghouses (updates host when doghouse stats change)
CREATE TRIGGER trg_doghouse_host_stats
AFTER UPDATE OF woofviews_count, star_count ON doghouses
FOR EACH ROW EXECUTE FUNCTION update_host_stats();

-- =============================================
-- SEED DATA
-- =============================================

-- Doghouse types
INSERT INTO doghouse_types (name, description) VALUES
    ('niche', 'Doghouseshare - Share a doghouse space with other dogs'),
    ('nicholoc', 'Whole doghouse - Rent the entire doghouse exclusively'),
    ('nichortoir', 'Doghouseroom - Rent a private room within a larger doghouse');

-- Sample options
INSERT INTO options (name, description) VALUES
    ('Heated floor', 'Warm and cozy heated flooring'),
    ('Outdoor area', 'Access to a fenced outdoor play area'),
    ('Premium food', 'High-quality gourmet dog food included'),
    ('Grooming service', 'Professional grooming available'),
    ('24/7 supervision', 'Round-the-clock staff supervision'),
    ('Pool access', 'Access to a dog-friendly pool'),
    ('Training sessions', 'Basic training sessions included'),
    ('Webcam access', 'Watch your dog remotely via webcam');

-- Sample catchphrases
INSERT INTO catchphrases (catchphrase) VALUES
    ('Find the perfect den for your furry friend!'),
    ('Where every pup finds their palace'),
    ('Bark-worthy stays, tail-wagging memories'),
    ('Home away from home, for your best friend');

-- =============================================
-- HELPER VIEWS
-- =============================================

-- View for active doghouse listings with all details
CREATE VIEW v_doghouse_listings AS
SELECT
    d.id,
    d.price,
    d. country,
    d.city,
    d.bed_count,
    d. dog_count,
    d.doghouse_count,
    d.bowl_area_count,
    d.woofviews_count,
    d.star_count,
    d.description,
    dt.name AS type_name,
    h.id AS host_id,
    u.pseudo AS host_name,
    h.star_count AS host_star_count
FROM doghouses d
JOIN doghouse_types dt ON d.type_id = dt.id
JOIN hosts h ON d.host_id = h.id
JOIN users u ON h. user_id = u.id
WHERE d.deleted_at IS NULL
  AND h.deleted_at IS NULL
  AND u.deleted_at IS NULL;

-- View for active bookings
CREATE VIEW v_active_bookings AS
SELECT
    b. id,
    b.check_in,
    b.check_out,
    b. total_price,
    b.status,
    b.created_at,
    d.id AS doghouse_id,
    d.city,
    d. country,
    u.id AS guest_id,
    u.pseudo AS guest_name
FROM bookings b
JOIN doghouses d ON b.doghouse_id = d.id
JOIN users u ON b.guest_id = u. id
WHERE b. deleted_at IS NULL
  AND d. deleted_at IS NULL
  AND u. deleted_at IS NULL;