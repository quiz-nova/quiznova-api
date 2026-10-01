using MediatR;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

using QuizNova.Api.DTOs.Requests;
using QuizNova.Api.Mappers;
using QuizNova.Application.Common.Caching;
using QuizNova.Application.Common.Models;
using QuizNova.Application.Features.Admins.DTOs;
using QuizNova.Application.Features.Admins.Queries.GetAdminById;
using QuizNova.Application.Features.Admins.Queries.GetAllAdmins;
using QuizNova.Domain.Entities.Identity;

namespace QuizNova.Api.Controllers;

[ApiController]
[Route("admins")]
[Authorize(Roles = nameof(UserRole.Admin))]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
public sealed class AdminController(ISender sender) : ApiController
{
    [EndpointSummary("Retrieves all admins.")]
    [EndpointDescription("Returns a paginated and filterable list of admin users.")]
    [EndpointName("GetAllAdmins")]
    [HttpGet]
    [OutputCache(Tags = [CacheTags.Admins])]
    [ProducesResponseType(typeof(PaginatedList<AdminDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAllAdmins([FromQuery] GetAllAdminsQuery query, CancellationToken ct)
    {
        var result = await sender.Send(query, ct);

        return result.Match(Ok, Problem);
    }

    [EndpointSummary("Retrieves an admin by id.")]
    [EndpointDescription("Fetches a single admin using the provided admin identifier.")]
    [EndpointName("GetAdminById")]
    [HttpGet("{id:guid}")]
    [OutputCache(Tags = [CacheTags.Admins])]
    [ProducesResponseType(typeof(AdminDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdminById([FromRoute] Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetAdminByIdQuery(id), ct);

        return result.Match(
            Ok,
            Problem);
    }

    [EndpointSummary("Creates a new admin.")]
    [EndpointDescription("Creates an admin account from the submitted request payload.")]
    [EndpointName("CreateAdmin")]
    [HttpPost]
    [ProducesResponseType(typeof(AdminDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminRequest request, CancellationToken ct)
    {
        var command = request.ToCommand();

        var result = await sender.Send(command, ct);

        return result.Match(
            Ok,
            Problem);
    }
}
