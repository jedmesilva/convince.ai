import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { v4 as randomUUID } from 'uuid';

// Definição simplificada de usuário para uso interno
interface SelectUser {
  id: string;
  username: string;
  password: string;
  created_at: Date;
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'secret-fallback-for-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Nome de usuário não encontrado' });
        }
        
        if (user.password === 'auth_managed') {
          // Autenticação gerenciada pelo Supabase Auth
          return done(null, false, { message: 'Use a autenticação do Supabase' });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Senha incorreta' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Rota para registrar novo usuário
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, id } = req.body;
      
      // Verifica se já existe um usuário com esse username
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }
      
      // Se não houver password, assume que é um registro via Supabase Auth
      // e usa o ID fornecido pelo Supabase
      if (!password || password === 'auth_managed') {
        if (!id) {
          return res.status(400).json({ error: "ID é obrigatório para contas Supabase" });
        }
        
        const user = await storage.createUser({
          id,
          username,
          password: 'auth_managed',
        });
        
        return res.status(201).json(user);
      }
      
      // Caso contrário, cria um usuário normal com senha hash
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });
      
      // Faz login automático
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      next(error);
    }
  });

  // Rota para login
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // Rota para logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Rota para obter usuário atual
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}