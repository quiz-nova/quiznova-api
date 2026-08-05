using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Students.Queries.GetStudentById;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Users.Students;
using QuizNova.Tests.Common.Users.UserPersonalInformation;

namespace QuizNova.Application.SubcutaneousTests.Features.Students.Queries.GetStudentById;

public class GetStudentByIdQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetStudentByIdQuery(Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetStudentByIdQuery>(x => x.Id) &&
            e.Description == GetStudentByIdQueryValidator.ErrorMessages.IdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetStudentByIdQuery(Guid.NewGuid());

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.StudentNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingId_ShouldReturnStudentDto()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // 1. Create a Student
        var student = StudentFactory.CreateStudent(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: "Existing Student",
                email: $"student_{Guid.NewGuid()}@example.com")).Value;

        // 2. Save directly to DB
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertOneAsync(student);

        }

        var query = new GetStudentByIdQuery(student.Id);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Id.Should().Be(student.Id);
        result.Value.PersonalInformation.Name.Should().Be("Existing Student");
        result.Value.PersonalInformation.Email.Should().Be(student.PersonalInformation.Email);
    }
}
