DROP TABLE calTable;
DROP TABLE resvTable;

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
    'cal-000000',
    'https://www.google.com/calendar/feeds/brownipp%40gmail.com/public/basic',
    'The first calendar',
    'Zhixiong Chen',
    'zhixiong_chen@brown.edu',
    1420002000,
    '08:00',
    '20:00',
    10
);