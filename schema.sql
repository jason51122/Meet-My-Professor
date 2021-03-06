DROP TABLE IF EXISTS calTable;
DROP TABLE IF EXISTS resvTable;

CREATE TABLE calTable (
    calID TEXT PRIMARY KEY,
    calLink TEXT,
    calLoc TEXT,
    instructions TEXT,    
    name TEXT,
    email TEXT,
    startTime TEXT,
    endTime TEXT,
    interim TEXT, 
    openPeriod TEXT
);

CREATE TABLE resvTable (
    resvID TEXT PRIMARY KEY,
    calID TEXT,
    name TEXT,
    email TEXT,
    forWhat TEXT,
    startTime TEXT,
    endTime TEXT,
    FOREIGN KEY(calID) REFERENCES calTable(calID)
);

INSERT INTO calTable VALUES(
    'cal-000000',
    'http://www.google.com/calendar/feeds/76m5e1apkocdog3c5pnoo28p0kij8psk%40import.calendar.google.com/public/basic',
    'CIT 411',
    'instructions',
    'Zhixiong Chen',
    'zhixiong_chen@brown.edu',
    '08:00',
    '20:00',
    '00:10',
    '2'
);