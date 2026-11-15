-- Optional extras after 0001_init.sql.
-- New rooms already get two parties + four seed bubbles via start_room().

-- Sticker filenames live in the Angular repo (src/assets/stickers/), not Storage.
-- Create the Storage bucket in the dashboard if you want uploads later:
--   name: story-images
--   public read, authenticated upload, 1 MB, image MIME only.

-- Demo issue banners (the app also ships these as a TypeScript constant):
--   Youth centre hours — later nights or earlier mornings?
--   Golden Bay access — bus, bike lane, or leave it wild?
--   Ferry timetable — more Sunday boats to Gozo?
