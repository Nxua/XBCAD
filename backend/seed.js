import bcrypt from 'bcrypt';
import User from './User.js'; // Adjust the path if needed
import connectDB from './db.js'; // Adjust the path if needed

const seedEmployees = async () => {
  await connectDB();

  const employees = [
    { email: 'lukesowray1@gmail.com', password: 'P@SswORD_2003', name: 'Luke Sowray' },
    { email: 'employee@gmail.com', password: 'P@SswORD_2003', name: 'Selwyn Gounder' },
  ];

  try {
    for (const employee of employees) {
      const hashedPassword = await bcrypt.hash(employee.password, 10);
      await User.create({ ...employee, password: hashedPassword });
    }
    console.log('Employees seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding employees:', error);
    process.exit(1);
  }
};

seedEmployees();
