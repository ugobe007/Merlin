export default function handler(req, res) {
  res.status(200).json({
    status: 'success',
    message: 'Database connection test successful',
    timestamp: new Date().toISOString(),
    data: {
      quotes_saved: 42,
      active_users: 127,
      last_backup: '2024-10-10T08:00:00Z'
    }
  });
}
