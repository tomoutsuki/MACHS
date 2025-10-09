// Demo data script to populate test patients for the hospital system
const axios = require('axios');

const EHR_BASE_URL = process.env.EHR_BASE_URL || 'http://localhost:3001';

// Sample patient data for demonstration
const samplePatients = [
    {
        name: 'Ana Maria Santos',
        cpf: '123.456.789-01',
        birthDate: '1990-03-15',
        gender: 'female',
        phone: '(11) 98765-4321',
        email: 'ana.santos@email.com',
        address: 'Rua das Flores, 123 - São Paulo, SP',
        diagnosis: 'Hypertension'
    },
    {
        name: 'João Silva Oliveira',
        cpf: '987.654.321-09',
        birthDate: '1985-07-22',
        gender: 'male', 
        phone: '(11) 91234-5678',
        email: 'joao.silva@email.com',
        address: 'Av. Paulista, 456 - São Paulo, SP',
        diagnosis: 'Diabetes Mellitus Type 2'
    },
    {
        name: 'Maria José Lima',
        cpf: '456.789.123-45',
        birthDate: '1978-11-08',
        gender: 'female',
        phone: '(11) 95555-1234',
        email: 'maria.lima@email.com', 
        address: 'Rua Augusta, 789 - São Paulo, SP',
        diagnosis: 'Chronic Kidney Disease'
    },
    {
        name: 'Carlos Eduardo Costa',
        cpf: '321.654.987-12',
        birthDate: '1992-05-30',
        gender: 'male',
        phone: '(11) 94444-9876',
        email: 'carlos.costa@email.com',
        address: 'Rua da Consolação, 321 - São Paulo, SP', 
        diagnosis: 'Acute Myocardial Infarction'
    },
    {
        name: 'Fernanda Alves Pereira',
        cpf: '789.123.456-78',
        birthDate: '1995-12-03',
        gender: 'female',
        phone: '(11) 93333-2468',
        email: 'fernanda.alves@email.com',
        address: 'Rua Oscar Freire, 654 - São Paulo, SP',
        diagnosis: 'Seasonal Allergic Rhinitis'
    }
];

async function createDemoPatients() {
    console.log('🏥 Creating demo patients for MACHS Hospital System...');
    console.log(`📡 Connecting to EHR service at ${EHR_BASE_URL}`);
    
    try {
        // Check if EHR service is running
        await axios.get(`${EHR_BASE_URL}/health`);
        console.log('✅ EHR service is online');
        
        // Create each patient
        for (let i = 0; i < samplePatients.length; i++) {
            const patient = samplePatients[i];
            
            try {
                console.log(`📝 Creating patient: ${patient.name}`);
                
                const response = await axios.post(`${EHR_BASE_URL}/patients`, patient, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': 'admin' // Use admin user for demo data creation
                    }
                });
                
                if (response.status === 201) {
                    console.log(`✅ Created patient ${patient.name} with ID: ${response.data.patientId}`);
                } else {
                    console.log(`⚠️  Unexpected response for ${patient.name}:`, response.status);
                }
                
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                if (error.response) {
                    console.error(`❌ Failed to create ${patient.name}:`, error.response.data);
                } else {
                    console.error(`❌ Network error creating ${patient.name}:`, error.message);
                }
            }
        }
        
        console.log('\n🎉 Demo data creation completed!');
        console.log('\n📊 You can now:');
        console.log('1. Login to the hospital system at http://localhost:3002/hospital');
        console.log('2. Try different user profiles to see access control in action');
        console.log('3. Search for patients by name or CPF');
        console.log('4. View patient records with role-based permissions');
        console.log('\n🔍 Try searching for:');
        console.log('- Name: "Ana Maria" or "João Silva"');
        console.log('- CPF: "123.456.789-01" or "987.654.321-09"');
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Cannot connect to EHR service. Please make sure it\'s running:');
            console.error('   cd ehr-system && npm start');
        } else {
            console.error('❌ Error connecting to EHR service:', error.message);
        }
        process.exit(1);
    }
}

// Run the demo data creation
if (require.main === module) {
    createDemoPatients().catch(console.error);
}

module.exports = { createDemoPatients, samplePatients };