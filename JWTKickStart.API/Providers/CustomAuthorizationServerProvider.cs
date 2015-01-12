using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.OAuth;

namespace JWTKickStart.API.Providers
{
	public class CustomAuthorizationServerProvider : OAuthAuthorizationServerProvider
	{
		public override Task ValidateClientAuthentication(OAuthValidateClientAuthenticationContext context)
		{
			string clientId;
			string clientSecret;

			if (!context.TryGetBasicCredentials(out clientId, out clientSecret))
			{
				context.TryGetFormCredentials(out clientId, out clientSecret);
			}

			if (context.ClientId == null)
			{
				context.SetError("invalid_clientId", "ClientId should be sent.");
				return Task.FromResult<object>(null);
			}

			if (context.ClientId != ConfigurationManager.AppSettings["jwt:ClientId"])
			{
				context.SetError("invalid_clientId", string.Format("Invalid CliendId: '{0}'", context.ClientId));
				return Task.FromResult<object>(null);
			}

			context.Validated();
			return Task.FromResult<object>(null);
		}

		public override async Task GrantResourceOwnerCredentials(OAuthGrantResourceOwnerCredentialsContext context)
		{
			if (context.UserName == null)
			{
				context.SetError("invalid_grant", "The user name is blank.");
				return;
			}

			if (context.Password == null)
			{
				context.SetError("invalid_grant", "The password is blank.");
				return;
			}

			IdentityUser user;
			using (var authRepository = new AuthRepository())
			{
				user = await authRepository.FindUser(context.UserName, context.Password);
			}

			var ticket = GetAuthenticationTicket(user, context.ClientId);

			context.Validated(ticket);
		}

		public override Task GrantRefreshToken(OAuthGrantRefreshTokenContext context)
		{
			var originalClientId = context.Ticket.Properties.Dictionary[ConfigurationManager.AppSettings["jwt:ClientIdPropertyKey"]];
			var currentClientId = context.ClientId;

			if (originalClientId != currentClientId)
			{
				context.SetError("invalid_clientId", "Invalid clientId in Refresh Token.");
				return Task.FromResult<object>(null);
			}

			IdentityUser user;
			using (var authContext = new AuthContext())
			using (var userManager = new UserManager<IdentityUser>(new UserStore<IdentityUser>(authContext)))
			{
				user = userManager.FindById(context.Ticket.Identity.GetUserId());
			}

			// rebuild the ticket in case (e.g.) roles change
			var ticket = GetAuthenticationTicket(user, originalClientId);
			//var newTicket = new AuthenticationTicket(new ClaimsIdentity(context.Ticket.Identity), context.Ticket.Properties);
			context.Validated(ticket);

			return Task.FromResult<object>(null);
		}

		private AuthenticationTicket GetAuthenticationTicket(IdentityUser user, string clientId)
		{
			if (user == null)
			{
				throw new ArgumentNullException("user");
			}

			var identity = new ClaimsIdentity("JWT");


			// will error if the required claims do not exist
			identity.AddClaim(new Claim(ClaimTypes.GivenName,
				user.Claims.Single(c => c.ClaimType == ClaimTypes.GivenName).ClaimValue));	// jwt: given_name
			identity.AddClaim(new Claim(ClaimTypes.Surname,
				user.Claims.Single(c => c.ClaimType == ClaimTypes.Surname).ClaimValue));	// jwt: family_name
			identity.AddClaim(new Claim(ClaimTypes.Name, user.UserName));					// jwt: unique_name
			identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id));				// jwt: sub
			//identity.AddClaim(new Claim(ClaimTypes.Role, "user"));						// todo: get these from the roles table
			identity.AddClaim(new Claim(ClaimTypes.Email, user.Email));						// jwt: email


			var props = new AuthenticationProperties(new Dictionary<string, string>
                {
					{ 
						ConfigurationManager.AppSettings["jwt:ClientIdPropertyKey"], clientId
					}
                });

			return new AuthenticationTicket(identity, props);
		}
		
		public override Task TokenEndpoint(OAuthTokenEndpointContext context)
		{
			foreach (var property in context.Properties.Dictionary)
			{
				context.AdditionalResponseParameters.Add(property.Key, property.Value);
			}

			return Task.FromResult<object>(null);
		}
	}
}