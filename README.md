# 🚚 TransitOps

**TransitOps** is a super simple app for managing your fleet of vehicles, drivers, and trips. 

Think of it like a smart digital assistant for a transport company. Instead of using messy paper logs or confusing Excel sheets, this app helps you keep track of everything in one place, making sure mistakes don't happen!

## 🌟 What can it do?

- **🚗 Manage Vehicles:** Keep track of all your trucks or cars, their condition, and if they are in the shop for repairs.
- **🧑‍✈️ Manage Drivers:** See all your drivers, check if their licenses are valid, and know who is currently driving.
- **🛣️ Track Trips:** Assign a vehicle and a driver to a trip. The app is smart enough to stop you from double-booking a driver or overloading a vehicle!
- **🛡️ Keep Everyone Safe:** The app will automatically block a driver with a suspended license or an overloaded vehicle from starting a trip.

---

## 🛠️ For Developers (How to run this on your computer)

If you want to run this app on your own computer, follow these simple steps:

### 1. Download the code
Open your terminal and run:
```bash
git clone https://github.com/Manthan-Darji/TransitOps.git
cd TransitOps
```

### 2. Install the required tools
Run this command to install everything the app needs:
```bash
npm install
```

### 3. Set up the Database (Supabase)
We use a tool called **Supabase** to store our data. 
Create a new file named `.env.local` in the project folder and add your Supabase keys like this:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 4. Prepare the Database
Open the `supabase/schema.sql` file, copy everything inside it, and run it in your Supabase SQL Editor online.

### 5. Run the App!
Finally, start the app with this command:
```bash
npm run dev
```
Now, open your web browser and go to [http://localhost:3000](http://localhost:3000) to see the app in action!

---

## 📄 License

This project was built during a hackathon cycle.
