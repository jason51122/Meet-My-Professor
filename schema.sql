CREATE TABLE calTable (
    calID TEXT PRIMARY KEY,
    calLink TEXT,
    calDesp TEXT,
    name TEXT,
    email TEXT,
    expireDate INTEGER,
    startTime TEXT,
    endTime TEXT,
    interim INTEGER
);

CREATE TABLE resvTable (
	resvID TEXT PRIMARY KEY,
	calID TEXT,
	name TEXT,
	email TEXT,
	forWhat TEXT,
	startTime INTEGER,
	endTime INTEGER,
	FOREIGN KEY(calID) REFERENCES calTable(calID)
);

INSERT INTO calTable VALUES(
    '000000',
    'http://www.google.com/calendar/feeds/brownipp@gmail.com/public/basic',
    'The first calendar',
    'Zhixiong Chen',
    'zhixiong_chen@brown.edu',
    0,
    0,
    0,
    0
);