#!/bin/bash

# === WIELOPLATFORMOWY DEPLOYMENT SKRYPT ===

set -e

echo "🔧 Sprawdzanie zależności..."

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ Brak: $1. Zainstaluj przed kontynuacją."
    exit 1
  else
    echo "✅ $1 OK"
  fi
}

check_command node
check_command npm
check_command sqlite3

echo ""
echo "📦 Instalowanie zależności backendu..."
cd backend
npm install

echo "🛠️ Tworzenie bazy danych SQLite (jeśli nie istnieje)..."
node -e "const sqlite3 = require('sqlite3').verbose(); new sqlite3.Database('bp_data.db').close();"

cd ..

echo ""
echo "🎨 Instalowanie zależności frontendu..."
cd frontend
npm install

echo "⚙️ Budowanie frontendu React..."
npm run build

cd ..

echo ""
echo "🚀 Gotowe! Uruchamianie backendu (na porcie 4000)..."
cd backend
node index.js
