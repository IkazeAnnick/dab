CREATE DATABASE IF NOT EXISTS stock_management;
USE stock_management;

CREATE TABLE IF NOT EXISTS users (
  userid INT AUTO_INCREMENT PRIMARY KEY,
  userName VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS stockin (
  stockinId INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  itemname VARCHAR(255) NOT NULL,
  description TEXT,
  quantityin INT NOT NULL,
  totalquantityin INT NOT NULL,
  suppliername VARCHAR(255),
  stockindate TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(userid)
);

CREATE TABLE IF NOT EXISTS stockout (
  stockoutId INT AUTO_INCREMENT PRIMARY KEY,
  stockInId INT NOT NULL,
  userId INT NOT NULL,
  stockoutDate TEXT NOT NULL,
  totalquantityout INT NOT NULL,
  quantityout INT NOT NULL,
  FOREIGN KEY (stockInId) REFERENCES stockin(stockinId),
  FOREIGN KEY (userId) REFERENCES users(userid)
);
