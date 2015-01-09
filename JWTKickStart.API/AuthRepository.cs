using System;
using System.Linq;
using System.Threading.Tasks;
using JWTKickStart.API.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;

namespace JWTKickStart.API
{
	public class AuthRepository : IDisposable
	{
		private readonly AuthContext _authContext;
		private readonly UserManager<IdentityUser> _userManager;

		public AuthRepository()
		{
			_authContext = new AuthContext();
			_userManager = new UserManager<IdentityUser>(new UserStore<IdentityUser>(_authContext));
		}

		public async Task<IdentityUser> FindUser(string userName, string password)
		{
			var user = await _userManager.FindAsync(userName, password);

			return user;
		}

		public async Task<bool> AddRefreshToken(RefreshToken token)
		{
			
			var existingToken = _authContext.RefreshTokens.SingleOrDefault(r => r.Subject == token.Subject && r.ClientId == token.ClientId);

			if (existingToken != null)
			{
				await RemoveRefreshToken(existingToken);
			}

			_authContext.RefreshTokens.Add(token);

			return await _authContext.SaveChangesAsync() > 0;
		}

		public async Task<bool> RemoveRefreshToken(string refreshTokenId)
		{
			var refreshToken = await _authContext.RefreshTokens.FindAsync(refreshTokenId);

			if (refreshToken != null)
			{
				_authContext.RefreshTokens.Remove(refreshToken);
				return await _authContext.SaveChangesAsync() > 0;
			}

			return false;
		}

		public async Task<bool> RemoveRefreshToken(RefreshToken refreshToken)
		{
			_authContext.RefreshTokens.Remove(refreshToken);
			return await _authContext.SaveChangesAsync() > 0;
		}

		public async Task<RefreshToken> FindRefreshToken(string refreshTokenId)
		{
			var refreshToken = await _authContext.RefreshTokens.FindAsync(refreshTokenId);

			return refreshToken;
		}
		
		public void Dispose()
		{
			_authContext.Dispose();
			_userManager.Dispose();
		}
	}
}