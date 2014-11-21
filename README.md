Meet-My-Professor
=================

Brown University Computer Science Department Online Reservation System.

From Zhixiong Chen, Quan Fang, Zhidong Wu, Amanda Yao.

To run the project, please install sqlite3, node.js and follow the 3 steps as below:

1.	Create the database:
	sqlite3 mmp.db < schema.sql

2. 	Install packages:
	npm install

3.	Change the filename from lib/emailer/index.js.tmpl to lib/emailer/index.js.

3.	Run the server:
	node server.js
