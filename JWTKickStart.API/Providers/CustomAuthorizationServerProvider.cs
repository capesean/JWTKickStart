using System.Collections.Generic;
using System.Configuration;
using System.Security.Claims;
using System.Threading.Tasks;
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

			var identity = new ClaimsIdentity("JWT");

			using (var authRepository = new AuthRepository())
			{
				var user = await authRepository.FindUser(context.UserName, context.Password);

				if (user == null)
				{
					context.SetError("invalid_grant", "The user name or password is incorrect.");
					return;
				}

				//identity.AddClaim(new Claim(ClaimTypes.GivenName, "GET_FROM_DB"));	// jwt: given_name
				//identity.AddClaim(new Claim(ClaimTypes.Surname, "GET_FROM_DB"));		// jwt: family_name
				identity.AddClaim(new Claim(ClaimTypes.Name, context.UserName));		// jwt: unique_name
				identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id));		// jwt: sub
				//identity.AddClaim(new Claim(ClaimTypes.Role, "GET_FROM_DB"));			// roles
				identity.AddClaim(new Claim(ClaimTypes.Email, user.Email));				// jwt: email

			}

			var props = new AuthenticationProperties(new Dictionary<string, string>
                {
					{ 
						ConfigurationManager.AppSettings["jwt:ClientIdPropertyKey"], context.ClientId
					}
                });

			var ticket = new AuthenticationTicket(identity, props);
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

			// return a new token
			var newTicket = new AuthenticationTicket(new ClaimsIdentity(context.Ticket.Identity), context.Ticket.Properties);
			context.Validated(newTicket);

			return Task.FromResult<object>(null);
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