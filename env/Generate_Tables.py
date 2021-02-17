import psycopg2

conn = psycopg2.connect(database="Registry", user="postgres", password="postgrespass")
curs=conn.cursor()

# curs.execute("CREATE EXTENSION citext")

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
# curs.execute('drop table Account cascade')
# curs.execute('drop table Company cascade')
# curs.execute('drop table Worker cascade')
# curs.execute('drop table Employee cascade')
# curs.execute('drop table WorkerAvatar cascade')
# curs.execute(
# '''
# create table Account(
#     username citext not null,
#     password varchar not null,
#     CONSTRAINT account_username_PK PRIMARY KEY (username)
#     )
# ''')
# curs.execute(
# '''
# create table EmailAddress(
#     paired_account citext not null,
#     email citext not null,
#     CONSTRAINT emailaddress_paired_account_PK PRIMARY KEY (paired_account),
#     CONSTRAINT emailaddress_email_unique UNIQUE (email),
#     CONSTRAINT emailaddress_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username) ON DELETE
#     CASCADE ON UPDATE CASCADE
# )
# ''')
#
# curs.execute(
# '''
# create table Company(
#     id citext not null,
#     paired_account citext not null,
#     title varchar not null,
#     location varchar not null,
#     description varchar not null,
#     CONSTRAINT company_id_PK PRIMARY KEY (id),
#     CONSTRAINT company_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username) ON DELETE
#     CASCADE ON UPDATE CASCADE
#     )
# ''')
#
# curs.execute(
# '''
# create table Worker(
#     paired_account citext not null,
#     first_name varchar not null,
#     last_name varchar not null,
#     city varchar not null,
#     country varchar not null,
#     address varchar not null,
#     CONSTRAINT worker_paired_account_PK PRIMARY KEY (paired_account),
#     CONSTRAINT worker_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username) ON
#     DELETE CASCADE ON UPDATE CASCADE
# )
# ''')
#
# curs.execute(
# '''
# create table Employee(
#     paired_account citext not null,
#     paired_company citext not null,
#     CONSTRAINT employee_paired_account_paired_company_PK PRIMARY KEY (paired_account, paired_company),
#     CONSTRAINT employee_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username) ON
#     DELETE CASCADE ON UPDATE CASCADE,
#     CONSTRAINT employee_paired_company_FK FOREIGN KEY (paired_company) REFERENCES company(id) ON
#     DELETE CASCADE ON UPDATE CASCADE
# )
# ''')
#
# curs.execute('''
# create table WorkerAvatar(
#     paired_account citext not null,
#     avatar bytea not null,
#     CONSTRAINT workeravatar_paired_account_PK PRIMARY KEY (paired_account),
#     CONSTRAINT workeravatar_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username) ON
#     DELETE CASCADE ON UPDATE CASCADE
# )
# ''')
#
# curs.execute('''
# create table CompanyAvatar(
#     paired_company citext not null,
#     avatar bytea not null,
#     CONSTRAINT companyavatar_paired_company_PK PRIMARY KEY (paired_company),
#     CONSTRAINT companyavatar_paired_company_FK FOREIGN KEY (paired_company) REFERENCES company(id) ON
#     DELETE CASCADE ON UPDATE CASCADE
# )
# ''')
#
# curs.execute('''
# create table SearchQuery(
#     paired_company citext not null,
#     search_terms tsvector not null,
#     CONSTRAINT searchquery_paired_company_PK PRIMARY KEY (paired_company),
#     CONSTRAINT searchquery_paired_company_FK FOREIGN KEY (paired_company) REFERENCES company(id) ON
#     DELETE CASCADE ON UPDATE CASCADE
# )
# ''')
#
# curs.execute('''CREATE INDEX searchquery_weights_index ON SearchQuery USING GIN(search_terms)''')
#
# curs.execute('''CREATE OR REPLACE FUNCTION searchquery_tsvector_trigger() RETURNS TRIGGER AS
# $BODY$
# DECLARE
#     search_terms tsvector;
# BEGIN
#     search_terms := setweight(to_tsvector('simple', new.id), 'A') ||
#         setweight(to_tsvector('simple', new.location), 'B') ||
#         setweight(to_tsvector('simple', new.title), 'C') ||
#         setweight(to_tsvector('simple', new.description), 'D');
#     INSERT INTO
#         SearchQuery(paired_company,search_terms)
#         VALUES(new.id,search_terms);
#
#            RETURN new;
# END;
# $BODY$
# language plpgsql;
# ''')
#
# curs.execute('''CREATE TRIGGER tsvectorupdate AFTER INSERT OR UPDATE ON company FOR EACH ROW EXECUTE
# PROCEDURE searchquery_tsvector_trigger()''')
#
curs.execute('''create table settings(
    id smallserial,
    description varchar not null,
    CONSTRAINT settings_id_PK PRIMARY KEY (id)
)''')

curs.execute('''insert into settings(description) values ('Remember last identifier'), ('Toggle email notifications'), ('Toggle statistics partaking'), 
('Toggle company avatar'), ('Toggle match visibility'), ('Toggle applications')''')

curs.execute('''create table accountsettings(
    paired_account citext,
    setting_id integer,
    CONSTRAINT accountsettings_paired_account_setting_id_PK PRIMARY KEY (paired_account, setting_id),
    CONSTRAINT accountsettings_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username) ON
    DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT accountsettings_setting_id_FK FOREIGN KEY (setting_id) REFERENCES settings(id) ON
    DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT accountsettings_setting_id_CHK CHECK (setting_id BETWEEN 1 AND 3)
)''')

curs.execute('''create table companysettings(
    paired_company citext,
    setting_id integer,
    CONSTRAINT companysettings_paired_company_setting_id_PK PRIMARY KEY (paired_company, setting_id),
    CONSTRAINT companysettings_paired_company_FK FOREIGN KEY (paired_company) REFERENCES company(id) ON
    DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT companysettings_setting_id_FK FOREIGN KEY (setting_id) REFERENCES settings(id) ON
    DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT companysettings_setting_id_CHK CHECK (setting_id BETWEEN 4 AND 6)
)''')

curs.execute('''
create table connecthistory(
    paired_account citext not null,
    paired_company citext not null,
    connect_time timestamp not null,
    constraint connecthistory_paired_account_paired_company_PK PRIMARY KEY (paired_account, paired_company),
    constraint connecthistory_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username),
    constraint connecthistory_paired_company_FK FOREIGN KEY (paired_company) REFERENCES company(id)
)
'''

curs.execute('''
create table application(
	paired_account citext,
	paired_company citext,
	constraint application_paired_account_paired_company_PK PRIMARY KEY (paired_account, paired_company),
    constraint application_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username),
    constraint application_paired_company_FK FOREIGN KEY (paired_company) REFERENCES company(id)
)
''')

curs.execute('''
create table blockedapplication(
	paired_account citext,
	paired_company citext,
	constraint blockedapplication_paired_account_paired_company_PK PRIMARY KEY (paired_account, paired_company),
    constraint blockedapplication_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username),
    constraint blockedapplication_paired_company_FK FOREIGN KEY (paired_company) REFERENCES company(id)
)''')


curs.execute('''
create table feedhistory(
	paired_account citext,
	paired_company citext,
	text_message varchar(100) not null,
	post_time timestamp,
	constraint feedhistory_paired_account_paired_company_post_time_PK PRIMARY KEY (paired_account, paired_company, post_time),
    constraint feedhistory_paired_account_FK FOREIGN KEY (paired_account) REFERENCES account(username),
    constraint feedhistory_paired_company_FK FOREIGN KEY (paired_company) REFERENCES company(id)
)''')


conn.commit()

