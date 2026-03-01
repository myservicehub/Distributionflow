-- Create business and user for the CURRENTLY LOGGED IN user

-- First, create a new business for the current auth user
INSERT INTO businesses (name, address, owner_id)
VALUES ('My Distribution Business', 'Lagos, Nigeria', 'c70d18b9-025a-401c-a679-293fead2740d')
RETURNING *;

-- Copy the business ID from the result above, then run this:
-- Replace BUSINESS_ID_FROM_ABOVE with the actual ID

INSERT INTO users (business_id, auth_user_id, name, email, role, is_active)
VALUES ('BUSINESS_ID_FROM_ABOVE', 'c70d18b9-025a-401c-a679-293fead2740d', 'Admin User', 'your-email@example.com', 'admin', true)
RETURNING *;
