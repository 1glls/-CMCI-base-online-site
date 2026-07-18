#!/bin/bash
echo "=== DIAGNOSTIC COMPLET CMCI ==="

echo -e "\n1️⃣ Backend status:"
curl -s http://localhost:5000/api/health 2>/dev/null && echo "" || echo "❌ Backend NOT running on port 5000"

echo -e "\n2️⃣ Nombre d'événements dans la DB:"
curl -s http://localhost:5000/api/events 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ {len(data)} événements trouvés'); [print(f'  - {e[\"title\"]}') for e in data[:5]]" 2>/dev/null || echo "❌ Cannot fetch events"

echo -e "\n3️⃣ Frontend status:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$STATUS" = "200" ]; then
    echo "✅ Frontend running on port 3000 (Status: $STATUS)"
else
    echo "❌ Frontend NOT running or error (Status: $STATUS)"
fi

echo -e "\n4️⃣ Images événements présentes:"
COUNT=$(ls -1 src/frontend/public/images/event*.jpg 2>/dev/null | wc -l)
echo "✅ $COUNT images trouvées:"
ls -lh src/frontend/public/images/event*.jpg 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'

echo -e "\n5️⃣ Processus en cours:"
echo "Backend processes:"
ps aux | grep "node server.js" | grep -v grep | awk '{print "  PID: " $2 " - " $11 " " $12}' || echo "  ❌ Aucun"
echo "Frontend processes:"
ps aux | grep "next dev" | grep -v grep | awk '{print "  PID: " $2 " - " $11 " " $12}' | head -2 || echo "  ❌ Aucun"

echo -e "\n=== FIN DIAGNOSTIC ==="
