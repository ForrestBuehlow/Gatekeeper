
import sqlite3 from 'sqlite3';
const path = './database/gatekeeper.sqlite';

export async function hasPermissions(sid, uid, roles) {
	const userSql = `SELECT discordid FROM PrivilegedUsers WHERE sid = ? AND discordid = ?`;
	const users = await dbAll(userSql, sqlite3.OPEN_READONLY, [sid, uid]);

	if (users.length > 0) {
		return true;
	} else if (roles.length === 0) {
		return false;
	}

	const rolesSql = `SELECT rid FROM PrivilegedRoles WHERE sid = ? AND rid IN (${'?,'.repeat(roles.length - 1)}?)`;
	const privilegedRoles = await dbAll(rolesSql, sqlite3.OPEN_READONLY, [sid].concat(roles));

	return privilegedRoles.length > 0;
}

export function clearDefaultServerRole(sid) {
	const sql = `DELETE FROM DefaultServerRoles WHERE sid=?`;
	const params = [sid];

	return dbAll(sql, sqlite3.OPEN_READWRITE, params);
}

export function setDefaultServerRole(sid, rid) {
	const sql = `INSERT OR REPLACE INTO DefaultServerRoles (sid, rid) VALUES (?, ?)`;
	const params = [sid, rid];

	return dbAll(sql, sqlite3.OPEN_READWRITE, params);
}

export function getKeys(sid, key) {
	const sql = `SELECT * FROM ServerKeys WHERE sid=? AND key=?`;
	const params = [sid, key];

	return dbAll(sql, sqlite3.OPEN_READONLY, params);
}

export function insertKey(sid, key) {
	const sql = `INSERT INTO ServerKeys (sid, key) VALUES (?, ?)`;
	const params = [sid, key];

	return dbAll(sql, sqlite3.OPEN_READWRITE, params);
}

export function insertName(sid, key, name) {
	const sql = `INSERT INTO ServerKeyNames (sid, key, username) VALUES (?, ?, ?)`;
	const params = [sid, key, name];

	return dbAll(sql, sqlite3.OPEN_READWRITE, params);
}

export function insertRole(sid, key, rid) {
	const sql = `INSERT INTO ServerKeyRoles (sid, key, rid) VALUES (?, ?, ?)`;
	const params = [sid, key, rid];

	return dbAll(sql, sqlite3.OPEN_READWRITE, params);
}

export function setFeedbackPreferences(sid, option) {
	const sql = `INSERT OR REPLACE INTO ServerPreferences (sid, ephemeral) VALUES (?, ?)`;
	const params = [sid, option];

	return dbAll(sql, sqlite3.OPEN_READWRITE, params);
}

export async function getUserData(key, sid) {

	const sql = `SELECT verified.discordid, name.username, defaultRoles.rid as defaultRole
					FROM ServerKeys keys
					LEFT JOIN VerifiedUsers verified ON keys.sid=verified.sid AND keys.key=verified.key
					LEFT JOIN ServerKeyNames name ON keys.sid=name.sid AND keys.key=name.key
					LEFT JOIN DefaultServerRoles defaultRoles ON keys.sid=defaultRoles.sid
					WHERE keys.key=? AND keys.sid=?`;
	const params = [key, sid];

	return dbGet(sql, sqlite3.OPEN_READWRITE, params);
}

export function getServerPreferences(sid) {
	const sql = `SELECT ephemeral FROM ServerPreferences WHERE sid=?`;
	const params = [sid];

	return dbGet(sql, sqlite3.OPEN_READWRITE, params);
}

export async function verify(sid, key, uid) {
	const sql = `INSERT INTO VerifiedUsers VALUES(?, ?, ?)`;
	const params = [sid, key, uid];

	return dbGet(sql, sqlite3.OPEN_READWRITE, params);
}

export function getRoleIds(key, sid) {
	const sql = `SELECT roles.rid AS role 
					FROM ServerKeys keys
					LEFT JOIN ServerKeyRoles roles ON keys.sid=roles.sid AND keys.key=roles.key
					WHERE keys.key=? AND keys.sid=?;`
	const params = [key, sid];

	return dbAll(sql, sqlite3.OPEN_READWRITE, params);
}

export async function removeRoles(sid, rid) {
	const defaultRoleSql = `DELETE FROM DefaultServerRoles WHERE sid=? AND rid=?`;
	const serverRolesSql = `DELETE FROM ServerKeyRoles WHERE sid=? AND rid=?`;
	const params = [sid, rid];

	await dbGet(defaultRoleSql, sql.OPEN_READWRITE, params);
	await dbGet(serverRolesSql, sql.OPEN_READWRITE, params);
}

export function guildCreate(guildid) {
	const sql = `INSERT OR IGNORE INTO ServerPreferences VALUES (?, 1);`;
	const params = [guildid];

	return dbGet(sql, sqlite3.OPEN_READWRITE, params);
}

export function init() {
	let db = new sqlite3.Database(path, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

	db.run(`PRAGMA foreign_keys = ON`);
	db.run(`CREATE TABLE IF NOT EXISTS ServerKeys (sid TEXT NOT NULL, key TEXT NOT NULL, PRIMARY KEY(sid, key))`);
	db.run(`CREATE TABLE IF NOT EXISTS ServerKeyNames (sid TEXT NOT NULL, key TEXT NOT NULL, username TEXT NOT NULL, FOREIGN KEY(sid, key) REFERENCES ServerKeys, PRIMARY KEY(sid, key, username))`);
	db.run(`CREATE TABLE IF NOT EXISTS ServerKeyRoles (sid TEXT NOT NULL, key TEXT NOT NULL, rid TEXT NOT NULL, FOREIGN KEY(sid, key) REFERENCES ServerKeys, PRIMARY KEY(sid, key, rid))`);
	db.run(`CREATE TABLE IF NOT EXISTS VerifiedUsers (sid TEXT NOT NULL, key TEXT NOT NULL, discordid TEXT NOT NULL, FOREIGN KEY(sid, key) REFERENCES ServerKeys, PRIMARY KEY(sid, key, discordid))`);
	db.run(`CREATE TABLE IF NOT EXISTS DefaultServerRoles (sid TEXT NOT NULL PRIMARY KEY, rid TEXT NOT NULL)`);
	db.run(`CREATE TABLE IF NOT EXISTS PrivilegedUsers (sid TEXT NOT NULL, discordid TEXT NOT NULL, PRIMARY KEY(sid, discordid))`);
	db.run(`CREATE TABLE IF NOT EXISTS PrivilegedRoles (sid TEXT NOT NULL, rid TEXT NOT NULL, PRIMARY KEY(sid, rid))`);
	db.run(`CREATE TABLE IF NOT EXISTS ServerPreferences (sid TEXT NOT NULL PRIMARY KEY, ephemeral INTEGER NOT NULL DEFAULT 1)`);
	db.close();
}

export function dbAll(sql, mode, params) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(path, mode);
		db.all(sql, params, (err, data) => {
			db.close();
			if (err) {
				console.log(err);
				reject(err);
			}
			resolve(data);
		});
	});
}

export function dbGet(sql, mode, params) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(path, mode);
		db.get(sql, params, (err, data) => {
			db.close();
			if (err) {
				console.log(err);
				reject(err);
			}
			resolve(data);
		});
	});
}
