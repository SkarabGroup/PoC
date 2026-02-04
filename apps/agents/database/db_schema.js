// Collezione: users. Gestisce le credenziali di accesso degli utenti
const userSchema = {
  _id: ObjectId,
  email: String,              
  password: String,           //pass hashata
  username: String,           
  fullName: String,
  createdAt: Date,
  updatedAt: Date,
  role: String,              // es: "user", "admin"
  
  // GitHub OAuth
  githubAccount: {
    githubId: String,
    username: String,
    accessToken: String,      //token github criptati
    refreshToken: String,
    avatarUrl: String,
    profileUrl: String,
    email: String,
  }
};

// Indici per users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ "githubAccount.githubId": 1 }, { sparse: true });


// Collezione: repositories. Gestisce le repository caricate dagli utenti
const repositorySchema = {
  _id: ObjectId,
  userId: ObjectId,           
  
  // info repository
  name: String,
  fullName: String,
  description: String,
  url: String,
  
  //dati github
  githubData: {
    repoId: Number,
    owner: String,
    isPrivate: Boolean,
    defaultBranch: String,
    language: String,
    createdAt: Date,
    updatedAt: Date,
    pushedAt: Date,
    license: String
  },
  // timestamps
  createdAt: Date,
  updatedAt: Date,
  lastAnalyzedAt: Date,
  
  // statistiche rapide
  stats: {
    totalFiles: Number,
    totalLines: Number,
    totalSize: Number,
    languages: [{
      name: String,
      percentage: Number,
      lines: Number
    }]
  }
};

// Indici per repositories
db.repositories.createIndex({ userId: 1 });
db.repositories.createIndex({ "githubData.repoId": 1 }, { sparse: true });
db.repositories.createIndex({ fullName: 1, userId: 1 });
db.repositories.createIndex({ createdAt: -1 });

// Collezione: analysis_reports. Gestisce i report di analisi delle repository
const analysisReportSchema = {
  _id: ObjectId,
  repositoryId: ObjectId,
  userId: ObjectId,
  version: String,
  status: String, 
  
  // Risultati analisi
  results: {
    metrics: {
      totalFiles: Number,
      totalLines: Number,
      maintainabilityIndex: Number
    },
  },
  // Metadata esecuzione
  execution: {
    startedAt: Date,
    completedAt: Date,
    duration: Number,
    errorMessage: String,
    errorStack: String
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,

  // Report export
  exports: [{
    format: String,
    url: String,
    generatedAt: Date
  }]
};

// Indici per analysis_reports
db.analysis_reports.createIndex({ repositoryId: 1, createdAt: -1 });
db.analysis_reports.createIndex({ userId: 1, createdAt: -1 });
db.analysis_reports.createIndex({ status: 1 });
db.analysis_reports.createIndex({ createdAt: -1 });