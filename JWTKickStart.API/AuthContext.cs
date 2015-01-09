using System.Data.Entity;
using JWTKickStart.API.Models;
using Microsoft.AspNet.Identity.EntityFramework;

namespace JWTKickStart.API
{
	public class AuthContext : IdentityDbContext<IdentityUser>
	{
		public DbSet<RefreshToken> RefreshTokens { get; set; }
		
		public AuthContext()
			:base("MAIN")
		{
			
		}
	}
}