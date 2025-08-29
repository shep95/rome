#!/bin/bash

# Sanitization script for removing external service references
# This script should be run before any GitHub commits

echo "🔒 Sanitizing codebase for secure deployment..."

# Replace Supabase references
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" | \
  xargs sed -i.bak -E \
  -e 's/supabase/secure-backend/gi' \
  -e 's/lovable\.dev/secure-platform/gi' \
  -e 's/postgres/database/gi' \
  -e 's/auth\.users/auth.accounts/gi' \
  -e 's/mnijromffaalvpadojbj/secure-backend-id/gi' \
  -e 's/\.supabase\.co/.secure-backend.com/gi'

# Clean up backup files
find . -name "*.bak" -delete

echo "✅ Codebase sanitized successfully!"
echo "🚀 Ready for secure deployment to GitHub"