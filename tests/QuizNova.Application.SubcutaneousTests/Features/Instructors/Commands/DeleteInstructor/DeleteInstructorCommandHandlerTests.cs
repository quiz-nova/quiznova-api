using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Instructors.Commands.CreateInstructor;
using QuizNova.Application.Features.Instructors.Commands.DeleteInstructor;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Instructors.Commands.DeleteInstructor;

public class DeleteInstructorCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new DeleteInstructorCommand(Guid.Empty);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<DeleteInstructorCommand>(x => x.Id) &&
            e.Description == DeleteInstructorCommandValidator.ErrorMessages.IdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ShouldReturnNotFoundError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var nonExistentId = Guid.NewGuid();
        var command = new DeleteInstructorCommand(nonExistentId);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.InstructorNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingId_ShouldDeleteSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a valid Instructor first
        var uniqueEmail = $"instructor_{Guid.NewGuid()}@example.com";
        var uniquePhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createCommand = new CreateInstructorCommand(
            new PersonalInformationDto("Instructor to Delete", uniqueEmail, uniquePhone), "SecurePass123!",
            nameof(UserRole.Instructor));
        var createResult = await mediator.Send(createCommand);
        createResult.IsSuccess.Should().BeTrue();

        var instructorId = createResult.Value.Id;

        var deleteCommand = new DeleteInstructorCommand(instructorId);

        // Act
        var deleteResult = await mediator.Send(deleteCommand);

        // Assert
        deleteResult.IsSuccess.Should().BeTrue();

        // Verify removed from database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var instructorInDb = await mongoContext.Users.Find(u => u.UserRole == UserRole.Instructor && u.Id == instructorId).FirstOrDefaultAsync();
        instructorInDb.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithExistingIdDeletedTwice_ShouldReturnNotFoundErrorOnSecondDelete()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a valid Instructor first
        var uniqueEmail = $"instructor_{Guid.NewGuid()}@example.com";
        var uniquePhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createCommand = new CreateInstructorCommand(
            new PersonalInformationDto("Instructor to Delete Twice", uniqueEmail, uniquePhone), "SecurePass123!",
            nameof(UserRole.Instructor));
        var createResult = await mediator.Send(createCommand);
        createResult.IsSuccess.Should().BeTrue();

        var instructorId = createResult.Value.Id;

        var deleteCommand1 = new DeleteInstructorCommand(instructorId);
        var deleteCommand2 = new DeleteInstructorCommand(instructorId);

        // Act
        var deleteResult1 = await mediator.Send(deleteCommand1);
        var deleteResult2 = await mediator.Send(deleteCommand2);

        // Assert
        deleteResult1.IsSuccess.Should().BeTrue();
        deleteResult2.IsError.Should().BeTrue();
        deleteResult2.TopError.Code.Should().Be(ApplicationErrors.InstructorNotFound(Guid.Empty).Code);
    }

    private void EnsureAdminContext()
    {
        var adminId = Guid.Parse(TestUsers.Admin.User.Id);
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        if (!mongoContext.Users.Find(u => u.UserRole == UserRole.Admin && u.Id == adminId).Any())
        {
            var personalInfo = PersonalInformation.Create("Admin User", "admin@quiznova.local", "01000000000").Value;
            var admin = Admin.Create(adminId, personalInfo).Value;
            mongoContext.Users.InsertOne(admin);
        }

        TestCurrentUser.Set(TestUsers.Admin.User);
    }
}
