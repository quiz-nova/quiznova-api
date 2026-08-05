using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Admins.Queries.GetAdminById;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Users.Admins;
using QuizNova.Tests.Common.Users.UserPersonalInformation;

namespace QuizNova.Application.SubcutaneousTests.Features.Admins.Queries.GetAdminById;

public class GetAdminByIdQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetAdminByIdQuery(Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetAdminByIdQuery>(x => x.Id) &&
            e.Description == GetAdminByIdQueryValidator.ErrorMessages.IdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetAdminByIdQuery(Guid.NewGuid());

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.AdminNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingId_ShouldReturnAdminDto()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // 1. Create an Admin
        var admin = AdminFactory.Create(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: "Existing Admin",
                email: $"admin_{Guid.NewGuid()}@example.com")).Value;

        // 2. Save to DB
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertOneAsync(admin);

        }

        var query = new GetAdminByIdQuery(admin.Id);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Id.Should().Be(admin.Id);
        result.Value.PersonalInformation.Name.Should().Be("Existing Admin");
        result.Value.PersonalInformation.Email.Should().Be(admin.PersonalInformation.Email);
    }
}
