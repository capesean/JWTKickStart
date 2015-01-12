# JWTKickStart

JWTKickStart is designed to get an AngularJS project with JWT (OAuth) tokens up & running as quickly as possible.

There are two projects:
- JWTKickStart.APP: this is the standalone AngularJS application.
- JWTKickStart.API: this is the API application. It has been built with .NET OWIN in Visual Studio using a bunch of nuget projects. It handles the authorisation of the user, the issuing of the JWT tickets, and the issuing & validation of refresh tokens.

Note that the database backup is in the App_Data folder in the API project. Amend the connection string in web.config as required.

For more information, see: [capesean.co.za](http://capesean.co.za)
