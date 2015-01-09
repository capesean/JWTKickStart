using System;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;
using JWTKickStart.API.Models;
using Microsoft.Owin.Security.Infrastructure;

namespace JWTKickStart.API.Providers
{
	public class CustomRefreshTokenProvider : IAuthenticationTokenProvider
	{
		public async Task CreateAsync(AuthenticationTokenCreateContext context)
		{
			// to implement multiple clients, see: leastprivilege.com or bitoftech.com
			var clientid = context.Ticket.Properties.Dictionary[ConfigurationManager.AppSettings["jwt:ClientIdPropertyKey"]];

			if (string.IsNullOrEmpty(clientid))
			{
				return;
			}

			var refreshTokenId = Guid.NewGuid().ToString("N");

			using (var authRepository = new AuthRepository())
			{
				var userIdClaim = context.Ticket.Identity.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Name);
				if(userIdClaim ==null || userIdClaim.Value == null)
					throw new InvalidOperationException("AuthenticationTicket.Properties does not include ClientId");

				var token = new RefreshToken()
				{
					Id = Helper.GetHash(refreshTokenId),
					ClientId = clientid,
					Subject = userIdClaim.Value,
					IssuedUtc = DateTime.UtcNow,
					ExpiresUtc = DateTime.UtcNow.AddMinutes(Convert.ToDouble(ConfigurationManager.AppSettings["jwt:RefreshTokenLifetime"]))
				};

				context.Ticket.Properties.IssuedUtc = token.IssuedUtc;
				context.Ticket.Properties.ExpiresUtc = token.ExpiresUtc;

				token.ProtectedTicket = context.SerializeTicket();

				var result = await authRepository.AddRefreshToken(token);

				if (result)
				{
					context.SetToken(refreshTokenId);
				}

			}
		}

		public async Task ReceiveAsync(AuthenticationTokenReceiveContext context)
		{
			var hashedTokenId = Helper.GetHash(context.Token);

			using (var authRepository = new AuthRepository())
			{
				var refreshToken = await authRepository.FindRefreshToken(hashedTokenId);

				if (refreshToken != null)
				{
					context.DeserializeTicket(refreshToken.ProtectedTicket);
					await authRepository.RemoveRefreshToken(hashedTokenId);
				}
			}
		}

		public void Create(AuthenticationTokenCreateContext context)
		{
			throw new NotImplementedException();
		}

		public void Receive(AuthenticationTokenReceiveContext context)
		{
			throw new NotImplementedException();
		}
	}
}