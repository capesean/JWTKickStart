using System.Linq;
using System.Net.Http.Formatting;
using System.Net.Http.Headers;
using System.Web.Http;
using Microsoft.Owin.Security.OAuth;
using Newtonsoft.Json.Serialization;

namespace JWTKickStart.API
{
	public static class WebApiConfig
	{
		public static void Register(HttpConfiguration config)
		{
			//config.EnableCors();

			// disable cookie authentication
			config.SuppressDefaultHostAuthentication();
			// enable token authentication
			config.Filters.Add(new HostAuthenticationFilter(OAuthDefaults.AuthenticationType));

			// Web API routes
			config.MapHttpAttributeRoutes();

			config.Routes.MapHttpRoute(
				name: "DefaultApi",
				routeTemplate: "api/{controller}/{id}",
				defaults: new { id = RouteParameter.Optional }
			);

			config.IncludeErrorDetailPolicy = IncludeErrorDetailPolicy.Always;
			config.Formatters.JsonFormatter.SupportedMediaTypes.Add(new MediaTypeHeaderValue("text/html"));
			var jsonFormatter = config.Formatters.OfType<JsonMediaTypeFormatter>().First();
			//jsonFormatter.SerializerSettings.Formatting = Newtonsoft.Json.Formatting.Indented; // assists with debugging
			jsonFormatter.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
		}
	}
}
