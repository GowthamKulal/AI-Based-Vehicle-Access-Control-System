## Smart Surveillance System


# First Run the Python Backend:
1. cd API
2. .\env\Scripts\activate
3. uvicorn main:app --reload
4. Wait until the `Application startup complete.` message shows up.



# Next, run the development server (Next JS) in a new terminal:
1. cd APP
2. cd smart-surveillance
3. npm install --legacy-peer-deps
4. npm run build
5. npm start

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.



## Pages:
1. VisitorPage (Home). path = / (For visitors to send request)

2. Admin Login. path = /login (For admins to login)

3. Admin Dashboard. path = /admin/dashboard (For admins to see dashboard)

4. RequestsPage. path /admin/requests (For admins to see visitor requests)

5. AuthorizedPage. path = /admin/authorized (For admins to see authorized visitors)

6. LogsPage. path = /admin/logs (For admins to see logs)


