// Sample patient data for testing the EHR system
const samplePatients = [
  {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1985-06-15",
    gender: "male",
    email: "john.doe@email.com",
    phone: "+1-555-0123",
    address: {
      street: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      country: "USA"
    },
    medicalHistory: [
      {
        condition: "Hypertension",
        diagnosisDate: "2020-03-15",
        status: "chronic"
      },
      {
        condition: "Type 2 Diabetes",
        diagnosisDate: "2019-11-22",
        status: "chronic"
      }
    ],
    allergies: ["Penicillin", "Shellfish"],
    medications: [
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        startDate: "2019-11-22"
      },
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        startDate: "2020-03-15"
      }
    ]
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    dateOfBirth: "1990-02-28",
    gender: "female",
    email: "jane.smith@email.com",
    phone: "+1-555-0456",
    address: {
      street: "456 Oak Avenue",
      city: "Madison",
      state: "WI",
      zipCode: "53703",
      country: "USA"
    },
    medicalHistory: [
      {
        condition: "Asthma",
        diagnosisDate: "2010-05-10",
        status: "active"
      }
    ],
    allergies: ["Dust mites", "Pollen"],
    medications: [
      {
        name: "Albuterol Inhaler",
        dosage: "90mcg",
        frequency: "As needed",
        startDate: "2010-05-10"
      }
    ]
  },
  {
    firstName: "Robert",
    lastName: "Johnson",
    dateOfBirth: "1975-12-03",
    gender: "male",
    email: "robert.johnson@email.com",
    phone: "+1-555-0789",
    address: {
      street: "789 Pine Street",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA"
    },
    medicalHistory: [],
    allergies: [],
    medications: []
  }
];

// Sample sensitive data for testing encryption
const sampleSensitiveData = {
  bloodType: "O+",
  socialSecurityNumber: "XXX-XX-1234",
  emergencyContact: {
    name: "Mary Doe",
    relationship: "spouse",
    phone: "+1-555-0124"
  },
  insuranceInfo: {
    provider: "HealthCare Plus",
    policyNumber: "HC123456789",
    groupNumber: "GRP001"
  },
  labResults: [
    {
      test: "Complete Blood Count",
      date: "2024-01-15",
      results: {
        hemoglobin: "14.2 g/dL",
        hematocrit: "42.1%",
        whiteBloodCells: "6,800/μL",
        platelets: "285,000/μL"
      }
    }
  ]
};

module.exports = {
  samplePatients,
  sampleSensitiveData
};