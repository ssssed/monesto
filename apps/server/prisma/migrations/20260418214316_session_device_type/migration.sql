DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relname = 'sessions_userId_deviceType_key'
    ) THEN
        ALTER INDEX "sessions_userId_deviceType_key" RENAME TO "sessions_userId_device_type_key";
    END IF;
END $$;
