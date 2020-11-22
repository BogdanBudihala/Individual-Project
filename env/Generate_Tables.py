import psycopg2

conn = psycopg2.connect(database="Registry", user="BBogdan", password="postgrespass")
curs=conn.cursor()

#curs.execute("CREATE EXTENSION citext")

#curs.execute('''
#create table Workers(
#    worker_id integer generated always as identity,
#    first_name text not null,
#    last_name text not null,
#    rank text not null,
#    base_salary numeric(4, 3) not null,
#    department text not null,
#    salary_modifier numeric(3, 3) not null,
#    linked_account text,
#    CONSTRAINT fname_invalid CHECK(first_name ~ '^([a-zA-Z]{1,} {0,1}-{0,1}){1,}[a-zA-Z]{1,}$'),
#    CONSTRAINT lname_invalid CHECK(last_name ~ '^([a-zA-Z]{1,} {0,1}-{0,1}){1,}[a-zA-Z]{1,}$'),
#    CONSTRAINT rank_invalid CHECK(rank ~ '^([a-zA-Z0-9]{1,} {0,1}-{0,1}){1,}[a-zA-Z0-9]{1,}$'),
#    CONSTRAINT department_invalid CHECK(rank ~ '^([a-zA-Z0-9]{1,} {0,1}-{0,1}){1,}[a-zA-Z0-9]{1,}$'),
#    CONSTRAINT fname_length CHECK (char_length(first_name) <= 40 and char_length(first_name) >= 2),
#    CONSTRAINT lname_length CHECK (char_length(last_name) <= 40 and char_length(last_name) >= 2),
#    CONSTRAINT rank_length CHECK (char_length(rank) <= 50 and char_length(rank) >= 2),
#    CONSTRAINT dept_length CHECK (char_length(department) <= 50 and char_length(department) >= 2),
#    CONSTRAINT linked_account_paired UNIQUE (linked_account),
#    CONSTRAINT worker_id_taken PRIMARY KEY (worker_id)
#    );''')
curs.execute('drop table Accounts cascade')
curs.execute('drop table Companies cascade')
curs.execute('drop table WorkersProfile cascade')
curs.execute('drop table Employees cascade')
curs.execute(
'''
create table Accounts(
    username citext not null,
    password varchar not null,
    email citext not null,
    CONSTRAINT user_taken PRIMARY KEY (username),
    CONSTRAINT email_taken UNIQUE (email)
    )
''')

curs.execute(
'''
create table Companies(
    id citext not null,
    paired_account citext not null,
    title varchar not null,
    location varchar not null,
    description varchar not null,
    CONSTRAINT id_taken PRIMARY KEY (id),
    CONSTRAINT companies_paired_account_fkey FOREIGN KEY (paired_account) REFERENCES accounts(username) ON DELETE 
    CASCADE ON UPDATE CASCADE
    )
''')

curs.execute(
'''
create table WorkersProfile(
    paired_account citext not null,
    first_name varchar not null,
    last_name varchar not null,
    city varchar not null,
    country varchar not null,
    address varchar not null,
    CONSTRAINT workersprofile_account_already_paired PRIMARY KEY (paired_account),
    CONSTRAINT workersprofile_paired_account_fkey FOREIGN KEY (paired_account) REFERENCES accounts(username) ON 
    DELETE 
    CASCADE ON UPDATE CASCADE
)
''')

curs.execute(
'''
create table Employees(
    paired_account citext not null,
    paired_company citext not null,
    CONSTRAINT employees_account_already_paired PRIMARY KEY (paired_account, paired_company),
    CONSTRAINT employees_paired_account_fkey FOREIGN KEY (paired_account) REFERENCES accounts(username) ON 
    DELETE 
    CASCADE ON UPDATE CASCADE,
    CONSTRAINT employees_paired_company_fkey FOREIGN KEY (paired_company) REFERENCES companies(id) ON 
    DELETE 
    CASCADE ON UPDATE CASCADE
)
''')

#curs.execute(
#'''
#alter table accounts add
#    CONSTRAINT accounts_paired_company_id_fkey FOREIGN KEY (paired_company_id) REFERENCES companies(id) ON DELETE SET
#    NULL
#''')

conn.commit()

