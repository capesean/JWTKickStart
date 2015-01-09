using System.Configuration;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.DataHandler.Encoder;
using System;
using System.IdentityModel.Tokens;
using Thinktecture.IdentityModel.Tokens;

namespace JWTKickStart.API.Formats
{
	public class CustomJwtFormat : ISecureDataFormat<AuthenticationTicket>
	{
		private readonly string _issuer = string.Empty;

		public CustomJwtFormat(string issuer)
		{
			_issuer = issuer;
		}

		public string Protect(AuthenticationTicket data)
		{
			if (data == null)
			{
				throw new ArgumentNullException("data");
			}

			// to implement multiple clients, see: leastprivilege.com or bitoftech.com
			var clientIdPropertyKey = ConfigurationManager.AppSettings["jwt:ClientIdPropertyKey"];
			if (!data.Properties.Dictionary.ContainsKey(clientIdPropertyKey) || string.IsNullOrWhiteSpace(data.Properties.Dictionary[clientIdPropertyKey]))
				throw new InvalidOperationException("AuthenticationTicket.Properties does not include ClientId");
			var clientId = data.Properties.Dictionary[clientIdPropertyKey];

			// to generate a random key, you can use this code:
			//var secretBytes = new byte[32];
			//System.Security.Cryptography.RandomNumberGenerator.Create().GetBytes(secretBytes);
			//Console.Write(TextEncodings.Base64Url.Encode(secretBytes));

			var symmetricKeyAsBase64 = ConfigurationManager.AppSettings["jwt:Base64Secret"];
			var keyByteArray = TextEncodings.Base64Url.Decode(symmetricKeyAsBase64);
			var signingKey = new HmacSigningCredentials(keyByteArray);

			var issued = data.Properties.IssuedUtc;
			var expires = data.Properties.ExpiresUtc;

			var token = new JwtSecurityToken(
				_issuer,
				clientId, 
				data.Identity.Claims,
				(issued.HasValue ? issued.Value.UtcDateTime : (DateTime?)null),
				(expires.HasValue ? expires.Value.UtcDateTime : (DateTime?)null),
				signingKey);

			var handler = new JwtSecurityTokenHandler();

			var jwt = handler.WriteToken(token);

			return jwt;
		}

		public AuthenticationTicket Unprotect(string protectedText)
		{
			throw new NotImplementedException();
		}
	}
}