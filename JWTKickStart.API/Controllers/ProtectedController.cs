using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Web.Http;

namespace JWTKickStart.API
{
	[Authorize]
	[RoutePrefix("api/protected")]
	public class ProtectedController : ApiController
	{
		[Route("")]
		public IEnumerable<object> Get()
		{
			var identity = User.Identity as ClaimsIdentity;

			if (identity == null) return new List<string> {"no user!"};

			if (identity.Claims.ToList().Count == 0) return new List<string> { "no claims!" };

			return identity.Claims.Select(c => new
			{
				Type = c.Type,
				Value = c.Value
			});
		}
	}
}