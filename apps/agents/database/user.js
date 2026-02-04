const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//Schema User - Gestisce credenziali e account GitHub
const userSchema = new mongoose.Schema({
  // Credenziali base
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email non valida']
  },
  
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  
  fullName: {
    type: String,
    trim: true
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // GitHub Account
  githubAccount: {
    githubId: {
      type: String,
      unique: true,
      sparse: true 
    },
    username: String,
    accessToken: String,  //token criptati
    refreshToken: String,
    avatarUrl: String,
    profileUrl: String,
    email: String,
    connectedAt: Date,
    lastSync: Date,
    scopes: [String]  // Permessi GitHub
  },
  
  // Preferenze utente
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      analysisComplete: { type: Boolean, default: true }
    },
    defaultAnalysisConfig: {
      includeTests: { type: Boolean, default: true },
      autoAnalyze: { type: Boolean, default: false }
    }
  },
  
  // Metadata
  lastLogin: Date,
  lastActivity: Date
  
}, {
  timestamps: true  // Aggiunge automaticamente createdAt e updatedAt
});

// Indici
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'githubAccount.githubId': 1 }, { sparse: true });

// Hash password prima del salvataggio
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Metodo per verificare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Metodo per ottenere dati pubblici (senza password)
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName,
    role: this.role,
    hasGithubAccount: !!this.githubAccount?.githubId,
    githubUsername: this.githubAccount?.username,
    avatarUrl: this.githubAccount?.avatarUrl,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin
  };
};

// Metodo per collegare account GitHub
userSchema.methods.connectGithub = function(githubData) {
  this.githubAccount = {
    githubId: githubData.id,
    username: githubData.login,
    accessToken: githubData.accessToken,  // Criptare prima
    refreshToken: githubData.refreshToken,
    avatarUrl: githubData.avatar_url,
    profileUrl: githubData.html_url,
    email: githubData.email,
    connectedAt: new Date(),
    lastSync: new Date(),
    scopes: githubData.scope ? githubData.scope.split(',') : []
  };
  return this.save();
};

// Metodo per disconnettere account GitHub
userSchema.methods.disconnectGithub = function() {
  this.githubAccount = undefined;
  return this.save();
};

// Virtual per contare le repository
userSchema.virtual('repositoriesCount', {
  ref: 'Repository',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

module.exports = mongoose.model('User', userSchema);