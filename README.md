docker exec -it poc-mongodb-1 mongosh agenti_db --eval "
  db.users.insertOne({
    email: 'test@example.com',
    username: 'testuser',
    isActive: true,
    roles: ['user']
  })
"

curl -X POST http://localhost:3000/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "repoURL": "https://github.com/octocat/Hello-World",
    "userId": "698e39a11cea51219b8ce5b0"
  }'

docker logs poc-api-1

  docker exec -it poc-mongodb-1 mongosh agenti_db

docker exec -it poc-mongodb-1 mongosh agenti_db

db.analyses.find().pretty()
db.repositories.find().pretty()
db.users.find().pretty()

docker build -f Dockerfile.agents -t analyzer-agent:latest  .