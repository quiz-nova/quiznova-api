using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Instructors.Queries.GetInstructorById;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Users.Instructors;
using QuizNova.Tests.Common.Users.UserPersonalInformation;

namespace QuizNova.Application.SubcutaneousTests.Features.Instructors.Queries.GetInstructorById;

public class GetInstructorByIdQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetInstructorByIdQuery(Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetInstructorByIdQuery>(x => x.Id) &&
            e.Description == GetInstructorByIdQueryValidator.ErrorMessages.IdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetInstructorByIdQuery(Guid.NewGuid());

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.InstructorNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingId_ShouldReturnInstructorDto()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // 1. Create Instructor
        var instructor = InstructorFactory.CreateInstructor(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: "Existing Instructor",
                email: $"instructor_{Guid.NewGuid()}@example.com")).Value;

        // 2. Save to DB
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertOneAsync(instructor);

        }

        var query = new GetInstructorByIdQuery(instructor.Id);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Id.Should().Be(instructor.Id);
        result.Value.PersonalInformation.Name.Should().Be("Existing Instructor");
        result.Value.PersonalInformation.Email.Should().Be(instructor.PersonalInformation.Email);
    }
}
