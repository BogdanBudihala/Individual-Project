import psycopg2


class DBManager(object):

    def __init__(self, user, password):
        try:
            self.__conn = psycopg2.connect(database="Registry", user=user, password=password,
                                           host="127.0.0.1")
            self.__curs = self.__conn.cursor()
        except:
            raise Exception("0,Unable to establish connection with the Database.")

    def __del__(self):
        if self.__conn:
            self.__conn.close()

    def addAccount(self, username, password, email):
        self.__curs.execute(
            '''insert into account(username, password) values (%s,%s)''', (username, password)
        )
        self.__curs.execute(
            '''insert into emailaddress(paired_account, email) values (%s,%s)''', (username, email)
        )
        self.__conn.commit()

    def addCompany(self, identifier, pairedAcc, title, location, desc):
        self.__curs.execute(
            '''insert into company(id, paired_account, title, location, description) 
            values (%s,%s,%s,%s,%s)''', (identifier, pairedAcc, title, location, desc)
        )
        self.__curs.execute(
            '''insert into employee(paired_account, paired_company) values (%s,%s)''',
            (pairedAcc, identifier)
        )
        self.__conn.commit()

    def addWorkerProfile(self, pairedAcc, firstName, lastName, city, country, address):
        self.__curs.execute(
            '''insert into worker(paired_account, first_name, last_name, city, country, address) 
            values (%s,%s,%s,%s,%s,%s)''', (pairedAcc, firstName, lastName, city, country, address)
        )
        self.__conn.commit()

    def addEmployee(self, pairedAcc, pairedComp):
        # More args to be added
        self.__curs.execute(
            '''insert into employee(paired_account, paired_company) values (%s,%s)''', (pairedAcc, pairedComp)
        )
        self.__conn.commit()

    def loginEmployee(self, pairedAcc, pairedComp):
        self.__curs.execute(
            '''select * from company where id=%s''', (pairedComp,)
        )
        if self.__curs.fetchone() is None:
            raise Exception("0,Company is not present in Database.")
        self.__curs.execute(
            '''select * from employee where paired_account=%s and paired_company=%s''', (pairedAcc, pairedComp)
        )
        if self.__curs.fetchone() is None:
            raise Exception("1,Username and company ID combination is not present in Database.")

        self.__curs.execute(
            '''insert into connecthistory(paired_account, paired_company, connect_time) values (%s, %s, now())
            ON CONFLICT ON CONSTRAINT connecthistory_paired_account_paired_company_PK
            DO update set connect_time = now()''', (pairedAcc, pairedComp)
        )

        self.__conn.commit()
        return pairedComp

    def fetchPassword(self, username):
        self.__curs.execute(
            '''select password from account where username=%s''', (username,)
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,Username or password is not present in Database.")
        return retVal[0]

    def fetchWorkerProfile(self, username):
        self.__curs.execute('''select * from worker where paired_account=%s''', (username,))
        return True if self.__curs.fetchone() is not None else False

    def getWorkerDetails(self, username):
        self.__curs.execute(
            '''select * from worker where paired_account=%s''', (username,)
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,No paired worker profile associated with this user.")
        return retVal[1:]

    def fetchUserAvatar(self, username):
        self.__curs.execute('''select avatar from workeravatar where paired_account=%s''', (username,))
        retVal = self.__curs.fetchone()
        return retVal[0] if retVal is not None else None

    def updateUserAvatar(self, username, avatar):
        binaryImage = avatar.read()
        self.__curs.execute('''update workeravatar set avatar=%s where paired_account=%s''', (binaryImage, username))
        self.__conn.commit()

    def removeUserAvatar(self, username):
        self.__curs.execute('''delete from workeravatar where paired_account=%s''', (username,))
        self.__conn.commit()

    def addUserAvatar(self, username, avatar):
        binaryImage = avatar.read()
        self.__curs.execute('''insert into workeravatar(paired_account, avatar) values(%s, %s)''',
                            (username, binaryImage))
        self.__conn.commit()

    def getAccountEmailAddress(self, username):
        self.__curs.execute(
            '''select email from emailaddress where paired_account=%s''', (username,)
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,No paired account associated with this user.")
        return retVal[0]

    def getEnrolledCompanies(self, username):
        self.__curs.execute(
            '''select C0.paired_company, 
                (select title from company where id = C0.paired_company) title,
                (select avatar from companyavatar where paired_company = C0.paired_company) avatar from 
                (select paired_company from employee where paired_account=%s) C0''', (username,)
        )

        return self.__curs.fetchall()

    def updateWorkerProfile(self, username, actionType, newValue):
        columnIdentifier = ('first_name', 'last_name', 'city', 'country', 'address')
        queryBeforeParamBind = f'update worker set {columnIdentifier[actionType]}=%s where paired_account=%s'
        self.__curs.execute(queryBeforeParamBind, (newValue, username))
        self.__conn.commit()

    def getCompaniesMatchingKeyPhrase(self, username, keyPhrase, limit):
        sqlQuery = \
            '''
                    select C.id, C.title,
                    (select avatar from companyavatar where paired_company = C.id and 
                        (4 not in (select setting_id from companysettings where paired_company = C.id)
                         or %(username)s in (select paired_account from employee where paired_company = C.id)))
                    from company C where 5 not in (select setting_id from companysettings where paired_company=C.id)
                    order by random() desc limit %(limit)s
        ''' \
                if not keyPhrase else \
                '''
                    select Query.paired_company,
                    (select title from company where Query.paired_company = id) title,
                    (select avatar from companyavatar where paired_company = Query.paired_company and 
                        (4 not in (select setting_id from companysettings where paired_company = Query.paired_company)
                         or %(username)s in (select paired_account from employee where paired_company = Query.paired_company)))
                    from 
                    (select paired_company from searchquery SQ where search_terms @@ to_tsquery('simple', %(keyphrase)s)
                    and 5 not in (select setting_id from companysettings where paired_company=SQ.paired_company)
                    order by ts_rank(search_terms, to_tsquery('simple', %(keyphrase)s)) desc limit %(limit)s) Query
        '''
        parameters = {'username': username, 'limit': limit} if not keyPhrase else \
            {'keyphrase': keyPhrase, 'username': username, 'limit': limit}
        self.__curs.execute(sqlQuery, parameters)
        return self.__curs.fetchmany(limit)

    def fetchCompanyDetails(self, compID, username):
        self.__curs.execute(
            '''select location, title, description,
               (select avatar from companyavatar where paired_company = %(compID)s and 
                        (4 not in (select setting_id from companysettings where paired_company = %(compID)s)
                         or %(username)s in (select paired_account from employee where paired_company = %(compID)s))),
                (select case when 6 not in (select setting_id from companysettings where paired_company = %(compID)s)
                 then 1 else 0 end)
                from company where id=%(compID)s''', {'compID': compID, 'username': username}
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,Company identifier does not exist.")
        return retVal

    def fetchCEODetails(self, compID):
        self.__curs.execute(
            '''select WP.first_name || ' ' || WP.last_name, 
                (select email from emailaddress where paired_account=P.paired_account) email,
                (select avatar from workeravatar where paired_account=P.paired_account) avatar
                from (select paired_account from company where id=%s) P, 
                (select paired_account, first_name, last_name from worker) WP
                where WP.paired_account = P.paired_account''', (compID,)
        )
        retVal = self.__curs.fetchone()
        if retVal is None:
            raise Exception("0,No CEO associated to this company ID.")
        return retVal

    def getRegisteredCompanies(self, username):
        self.__curs.execute('''select C.id, (select avatar from companyavatar where paired_company = C.id)
                                from company C where paired_account=%s''', (username,))
        return self.__curs.fetchall()

    def getAccountSettings(self, username):
        self.__curs.execute('''select setting_id from accountsettings where paired_account = %s''', (username,))
        return self.__curs.fetchall()

    def getCompanySettings(self, compID):
        self.__curs.execute('''select setting_id from companysettings where paired_company = %s''', (compID,))
        return self.__curs.fetchall()

    def removeSetting(self, key, settingId):
        tableName = "accountsettings" if settingId in range(1, 4) else "companysettings"
        columnName = "paired_account" if settingId in range(1, 4) else "paired_company"
        query = f'''delete from {tableName} where {columnName}=%s and setting_id=%s'''
        self.__curs.execute(query, (key, settingId))
        self.__conn.commit()

    def addSetting(self, key, settingId):
        tableValues = "accountsettings(paired_account, setting_id)" if settingId in range(1, 4) else \
            "companysettings(paired_company, setting_id)"
        query = f'''insert into {tableValues} values(%s, %s)'''
        self.__curs.execute(query, (key, settingId))
        self.__conn.commit()

    def fetchLastConnected(self, username):
        self.__curs.execute('''select paired_company from connecthistory where paired_account = %(user)s and 1 not in 
                    (select setting_id from accountsettings where paired_account = %(user)s)
                    order by connect_time desc limit 1;''', {'user': username})
        result = self.__curs.fetchone()
        return result[0] if result is not None else None

    def insertApplication(self, identifier, username):
        self.__curs.execute('''select * from employee where paired_account = %s and paired_company = %s''',
                            (username, identifier))
        if self.__curs.fetchone() is not None:
            raise Exception("0,User is an active employee of the company")

        self.__curs.execute('''select * from blockedapplication where paired_account = %s and paired_company = %s'''
                            , (username, identifier))
        if self.__curs.fetchone() is not None:
            raise Exception("1,User is prohibited from applying to this company")

        self.__curs.execute('''insert into application(paired_account, paired_company) values (%s, %s)
        ''', (username, identifier))
        self.__conn.commit()

    def handleApplication(self, identifier, username, operationType):
        mainQuery = 'delete from application where paired_account = %s and paired_company = %s'
        sideQuery = 'insert into employee(paired_account, paired_company) values (%s, %s)' if operationType == 0 else \
            'insert into blockedapplication(paired_account, paired_company) values (%s, %s)' if operationType == 2 \
                else None

        self.__curs.execute(mainQuery, (username, identifier))
        if sideQuery is not None:
            self.__curs.execute(sideQuery, (username, identifier))
        self.__conn.commit()

    def fetchApplication(self, identifier):
        self.__curs.execute('''select Ap.paired_account, (select email from emailaddress where paired_account = 
            Ap.paired_account), (select first_name || ' ' || last_name as name from worker where paired_account = 
            Ap.paired_account), (select avatar from workeravatar where paired_account = Ap.paired_account)
            from (select paired_account from application where paired_company = %s) Ap
        ''', (identifier,))

        return self.__curs.fetchall()

    def postFeed(self, identifier, username, text):
        self.__curs.execute('''insert into feedhistory(paired_account, paired_company, text_message, post_time) 
        values (%s, %s, %s, now())''', (username, identifier, text))
        self.__conn.commit()

    def fetchFeed(self, identifier):
        self.__curs.execute('''select FH.paired_account, to_char(FH.post_time, 'dd/mm/yyyy hh24:mi') post_time, 
            FH.text_message, (select avatar from workeravatar where paired_account = FH.paired_account)
            from feedhistory FH where FH.paired_company = %s order by FH.post_time desc''', (identifier,))
        return self.__curs.fetchall()


'''
    @classmethod
    def check_linked(cls, user, pw):
        if cls.__privilege is False: raise Exception("Checking entry privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('select linked_id from Accounts where username=? and password=?', (user, pw))
        if cls.__curs.fetchone()[0] is not None: raise Exception("Account has a linked worker ID.")

    @classmethod
    def check_pending(cls, user, pw):
        if cls.__privilege is False: raise Exception("Checking entry privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('select requested from Accounts where username=? and password=?', (user, pw))
        if cls.__curs.fetchone()[0] is not None: raise Exception("Account has a request pending.")

    @classmethod
    def search_unlink(cls, workerid):
        if cls.__privilege is False: raise Exception("Checking entry privilege disabled.")
        if isinstance(workerid, int) is False: raise ("Invalid Worker ID Parameter.")
        cls.__curs.execute('update Accounts set linked_id=? where linked_id=?', (None, workerid))
        cls.__conn.commit()

    @classmethod
    def set_pending(cls, user, val):
        if cls.__privilege is False: raise Exception("Setting entry privilege disabled.")
        if cls.__check_validity(user) is not None: raise Exception(
            "Username not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username not found in database.")
        if val is not None and val != 1: raise Exception("Invalid Value Parameter.")
        cls.__curs.execute('update Accounts set requested=? where username=?', (val, user))
        cls.__conn.commit()

    @classmethod
    def set_linked(cls, user, id):
        if cls.__privilege is False: raise Exception("Setting entry privilege disabled.")
        if cls.__check_validity(user) is not None: raise Exception(
            "Username not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username not found in database.")
        if id is not None and isinstance(id, int) is False: raise Exception("Invalid ID Parameter.")
        cls.__curs.execute('update Accounts set linked_id=? where username=?', (id, user))
        cls.__conn.commit()

    @classmethod
    def get_linkedid(cls, user, pw):
        if cls.__privilege is False: raise Exception("Setting entry privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('select linked_id from Accounts where username=? and password=?', (user, pw))
        val = cls.__curs.fetchone()
        if val is not None:
            return int(val[0])

    @classmethod
    def set_root(cls, user, pw, rootval):
        if cls.__privilege is False: raise Exception("Setting root privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        if isinstance(rootval, int) is False or rootval not in (0, 1): raise Exception("Invalid rootval parameter.")
        cls.__curs.execute('update Accounts set root=? where username=? and password=?', (rootval, user, pw))
        cls.__conn.commit()

    @classmethod
    def is_root(cls, user, pw):
        if cls.__privilege is False: raise Exception("Checking root privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('select * from Accounts where username=? and password=?', (user, pw))
        if int(cls.__curs.fetchone()[2]) == 1: return True
        return False

    @classmethod
    def add_entry(cls, user, pw):
        if cls.__privilege is False: raise Exception("Adding entry privilege disabled.")
        if cls.__check_validity(user) is not None: raise Exception("Username " + cls.__check_validity(user))
        if cls.__check_validity(pw) is not None: raise Exception("Password " + cls.__check_validity(pw))
        if cls.__check_availability(user) is True: raise Exception("Username has already been taken.")
        cls.__curs.execute('insert into Accounts(username, password, root) values (?, ?, ?)', (user, pw, 0))
        cls.__conn.commit()

    @classmethod
    def del_entry(cls, user, pw):
        if cls.__privilege is False: raise Exception("Removing entry privilege disabled.")
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_availability(user) is False: raise Exception("Username or Password not found in database.")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")
        cls.__curs.execute('delete from Accounts where username=? and password=?', (user, pw))
        cls.__conn.commit()

    @classmethod
    def check_entry(cls, user, pw):
        if cls.__check_validity(user) is not None or cls.__check_validity(pw) is not None: raise Exception(
            "Username or Password not found in database")
        if cls.__check_combo(user, pw) is False: raise Exception("Username or Password not found in database.")

    @staticmethod
    def __check_validity(inp):
        # Returns NONE if inp represents a valid username or password, or a string with the error message if inp is invalid
        if len(inp) < 8 or len(inp) > 64: return "must be between 8 and 64 characters in length."
        for chr in inp:
            if not chr.isdigit() and not chr.isalpha(): return "must contain only alpha-numerical characters."

    @classmethod
    def __check_availability(cls, inp):
        # TRUE = Username already exists, FALSE = Username not in database
        cls.__curs.execute('select * from Accounts where username=?', (inp,))
        if cls.__curs.fetchone() is not None: return True
        return False

    @classmethod
    def __check_combo(cls, user, pw):
        # TRUE = Username + Password combo is valid, FALSE = Username does not have a matching password
        cls.__curs.execute('select * from Accounts where username=? and password=?', (user, pw))
        if cls.__curs.fetchone() is None: return False
        return True
'''
