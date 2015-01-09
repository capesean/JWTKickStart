using System;
using System.Configuration;
using JWTKickStart.API.Formats;
using JWTKickStart.API.Providers;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.Owin;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.DataHandler.Encoder;
using Microsoft.Owin.Security.Jwt;
using Microsoft.Owin.Security.OAuth;
using Owin;
using System.Web.Http;

[assembly: OwinStartup(typeof(JWTKickStart.API.Startup))]
namespace JWTKickStart.API
{
	public class Startup
	{
		public void Configuration(IAppBuilder app)
		{
			// setup authentication
			app.UseCors(Microsoft.Owin.Cors.CorsOptions.AllowAll); // allow * for cors
			ConfigureOAuth(app);

			// setup webapi
			var config = new HttpConfiguration();
			WebApiConfig.Register(config);
			app.UseWebApi(config);

			// populate with a dummy user (Database.SetInitializer would go here)
			using (var authContext = new AuthContext())
			using (var userManager = new UserManager<IdentityUser>(new UserStore<IdentityUser>(authContext)))
			{
				const string testEmail = "test@test.com";

				if (userManager.FindByName(testEmail) != null)
				{
					return;
				}

				var user = new IdentityUser(testEmail);
				user.Email = testEmail;

				userManager.Create(user, "password");

			}

		}

		public void ConfigureOAuth(IAppBuilder app)
		{
			var oAuthServerOptions = new OAuthAuthorizationServerOptions
			{
				AllowInsecureHttp = Convert.ToBoolean(ConfigurationManager.AppSettings["jwt:AllowInsecureHttp"]),
				TokenEndpointPath = new PathString(ConfigurationManager.AppSettings["jwt:TokenEndpointPath"]),
				AccessTokenExpireTimeSpan = TimeSpan.FromMinutes(Convert.ToInt32(ConfigurationManager.AppSettings["jwt:AccessTokenLifetime"])),
				Provider = new CustomAuthorizationServerProvider(),
				AccessTokenFormat = new CustomJwtFormat(ConfigurationManager.AppSettings["jwt:Issuer"]),
				RefreshTokenProvider = new CustomRefreshTokenProvider()
			};

			// token generation (server)
			app.UseOAuthAuthorizationServer(oAuthServerOptions);
			
			// token validation (authentication)
			app.UseJwtBearerAuthentication(
				new JwtBearerAuthenticationOptions
				{
					AuthenticationMode = AuthenticationMode.Active,
					AllowedAudiences = new[] { ConfigurationManager.AppSettings["jwt:ClientId"] },
					IssuerSecurityTokenProviders = new IIssuerSecurityTokenProvider[]
					{
						new SymmetricKeyIssuerSecurityTokenProvider(
							ConfigurationManager.AppSettings["jwt:Issuer"], 
							TextEncodings.Base64Url.Decode(ConfigurationManager.AppSettings["jwt:Base64Secret"])
							)
					}
				});

		}
	}
}