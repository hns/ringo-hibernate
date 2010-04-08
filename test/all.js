// Run w/: $ ringo all

include('ringo/unittest');
var store = require('ringo/storage/hibernate');
var person, Person = store.defineClass('Person',
        {firstName: {type: 'string',    nullable: false},
         lastName:  {type: 'string',    nullable: false},
         birthDate: {type: 'timestamp', nullable: false},
         vitae:     {column: 'resume',  type: 'text', unique: true}});
const FIRST_NAME_1 = 'Hans';
const FIRST_NAME_2 = 'Herbert';
const LAST_NAME = 'Wurst';
const BIRTH_DATE_MILLIS = 123456789000;
const VITAE_1 = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, ' +
        'sed diam nonumy eirmod tempor invidunt ut labore et dolore magna ' +
        'aliquyam erat, sed diam voluptua. At vero eos et accusam et justo ' +
        'duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata ' +
        'sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, ' +
        'consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ' +
        'ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero ' +
        'eos et accusam et justo duo dolores et ea rebum. Stet clita kasd ' +
        'gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';
const VITAE_2 = VITAE_1 + ' Foo.';

exports.setUp = function () {
    store.withSession(function (session) { // Clean table.
        session.createQuery('delete from Person').executeUpdate();
    });
    assertNull(Person.get(1));
};

exports.testSessionInit = function () {
    assertTrue(store.getSession() instanceof org.hibernate.Session);
};

exports.testPersistCreation = function () {
    person = createTestPerson();
    person.save();
    person = Person.get(1);
    assertNotNull(person);
    assertEqual(FIRST_NAME_1, person.firstName);
    assertEqual(LAST_NAME, person.lastName);
    assertEqual(new Date(BIRTH_DATE_MILLIS), person.birthDate);
    assertEqual(VITAE_1, person.vitae);
};

exports.testPersistUpdating = function () {
    person = createTestPerson();
    person.save();
    person = Person.all()[0];
    assertNotNull(person);
    person.firstName = FIRST_NAME_2;
    person.save();
    person = Person.all()[0];
    assertNotNull(person);
    assertEqual(FIRST_NAME_2, person.firstName);
    assertEqual(LAST_NAME, person.lastName);
    assertEqual(new Date(BIRTH_DATE_MILLIS), person.birthDate);
    assertEqual(VITAE_1, person.vitae);
};

exports.testBasicQuerying = function () {
    person = createTestPerson();
    person.save();
    person = createTestPerson();
    person.firstName = FIRST_NAME_2;
    person.vitae = VITAE_2;
    person.save();
    store.withSession(function (session) {
        assertEqual(2, session.createCriteria('Person').list().size());
    });
    assertEqual(2, Person.all().length);
    assertEqual(LAST_NAME, Person.all()[0].lastName);
    assertEqual(VITAE_2, Person.query().equals('lastName', LAST_NAME).
            equals('firstName', FIRST_NAME_2).select('vitae')[0]);
    assertEqual(2, Person.query().equals('lastName', LAST_NAME).select().
            length);
};

exports.testPersistDeletion = function () {
    person = createTestPerson();
    person.save();
    person = Person.all()[0];
    person.remove();
    person = Person.all()[0];
    assertUndefined(person);
    assertEqual(0, Person.all().length);
};

exports.testPersistInvalidEntity = function () {
    person = createTestPerson();
    person.save();
    person = createTestPerson(); // `vitae/resume` must be unique.
    assertThrows(function () person.save(), org.hibernate.exception.
            ConstraintViolationException);
    person = createTestPerson();
    person.firstName = 42; // `firstName` must be string.
    assertThrows(function () person.save(), java.lang.ClassCastException);
    person = createTestPerson();
    person.lastName = new Date(); // `lastName` must be string.
    assertThrows(function () person.save(), java.lang.ClassCastException);
    person = createTestPerson();
    person.birthDate = null; // `birthDate` mustn't be null.
    assertThrows(function () person.save(), org.hibernate.
            PropertyValueException);
    assertThrows(function () (new Person).save(), org.hibernate.
            PropertyValueException); // "Empty" person must fail.
};

function createTestPerson() {
    return new Person({firstName: FIRST_NAME_1, lastName: LAST_NAME,
            birthDate: new Date(BIRTH_DATE_MILLIS), vitae: VITAE_1});
}

if (require.main == module.id) {
    require('ringo/unittest').run(exports);
}
