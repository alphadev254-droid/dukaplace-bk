@echo off
echo Running database migration to add is_active column...
node add-is-active-column.js
pause
