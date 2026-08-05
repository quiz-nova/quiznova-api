using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Common.Validation;
using QuizNova.Application.Features.Students.Queries.GetAllStudents;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Courses;
using QuizNova.Tests.Common.Enrollments;
using QuizNova.Tests.Common.Users.Students;
using QuizNova.Tests.Common.Users.UserPersonalInformation;

namespace QuizNova.Application.SubcutaneousTests.Features.Students.Queries.GetAllStudents;

public class GetAllStudentsQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithDefaultPagination_ShouldReturnPaginatedList()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetAllStudentsQuery();

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.PageNumber.Should().Be(1);
        result.Value.PageSize.Should().Be(10);
    }

    [Theory]
    [InlineData(0, 10, nameof(GetAllStudentsQuery.PageNumber))]
    [InlineData(-5, 10, nameof(GetAllStudentsQuery.PageNumber))]
    [InlineData(1, 0, nameof(GetAllStudentsQuery.PageSize))]
    [InlineData(1, -10, nameof(GetAllStudentsQuery.PageSize))]
    [InlineData(1, 101, nameof(GetAllStudentsQuery.PageSize))]
    public async Task Handle_WithInvalidPagination_ShouldReturnValidationError(int pageNumber, int pageSize,
        string expectedErrorProperty)
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetAllStudentsQuery(PageNumber: pageNumber, PageSize: pageSize);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e => e.Code == expectedErrorProperty);
    }

    [Fact]
    public async Task Handle_WithNegativeEnrolledCoursesCount_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetAllStudentsQuery(EnrolledCoursesCount: -1);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetAllStudentsQuery>(x => x.EnrolledCoursesCount) &&
            e.Description == GetAllStudentsQueryValidator.ErrorMessages.EnrolledCoursesCountMin);
    }

    [Fact]
    public async Task Handle_WithEmptyCourseId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetAllStudentsQuery(CourseId: Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetAllStudentsQuery>(x => x.CourseId) &&
            e.Description == GetAllStudentsQueryValidator.ErrorMessages.CourseIdInvalid);
    }

    [Fact]
    public async Task Handle_WithCourseIdButNullIsEnrolledInCourse_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetAllStudentsQuery(CourseId: Guid.NewGuid(), IsEnrolledInCourse: null);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetAllStudentsQuery>(x => x.IsEnrolledInCourse) &&
            e.Description == GetAllStudentsQueryValidator.ErrorMessages.IsEnrolledInCourseRequired);
    }

    [Fact]
    public async Task Handle_WithLongSearchTerm_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetAllStudentsQuery(SearchTerm: new string('a', 201));

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetAllStudentsQuery>(x => x.SearchTerm) &&
            e.Description == ValidationMessages.Pagination.SearchTermMax(200));
    }

    [Fact]
    public async Task Handle_WithSearchTerm_ShouldFilterCorrectly()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var uniqueSearchTerm = $"UniqueName_{Guid.NewGuid()}";

        var student1 = StudentFactory.CreateStudent(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: uniqueSearchTerm,
                email: $"student_{Guid.NewGuid()}@example.com")).Value;

        var student2 = StudentFactory.CreateStudent(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: "Other Student Name",
                email: $"student_{Guid.NewGuid()}@example.com")).Value;

        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertManyAsync([student1, student2]);
        }

        var query = new GetAllStudentsQuery(SearchTerm: uniqueSearchTerm);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().ContainSingle(s => s.Id == student1.Id);
        result.Value.Items.Should().NotContain(s => s.Id == student2.Id);
    }

    [Fact]
    public async Task Handle_WithEnrolledCoursesCount_ShouldFilterCorrectly()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        var studentNoCourses = StudentFactory.CreateStudent(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: $"StudentNoCourses_{Guid.NewGuid()}",
                email: $"student_{Guid.NewGuid()}@example.com")).Value;

        var studentWithCourse = StudentFactory.CreateStudent(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: $"StudentWithCourse_{Guid.NewGuid()}",
                email: $"student_{Guid.NewGuid()}@example.com")).Value;

        var course = CourseFactory.CreateCourse().Value;
        var enrollment = EnrollmentFactory.CreateEnrollment(studentId: studentWithCourse.Id, courseId: course.Id).Value;

        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertManyAsync([studentNoCourses, studentWithCourse]);
            await mongoContext.Courses.InsertOneAsync(course);
            await mongoContext.Enrollments.InsertOneAsync(enrollment);
        }

        var queryZero = new GetAllStudentsQuery(EnrolledCoursesCount: 0);
        var queryOne = new GetAllStudentsQuery(EnrolledCoursesCount: 1);

        // Act
        var resultZero = await mediator.Send(queryZero);
        var resultOne = await mediator.Send(queryOne);

        // Assert
        resultZero.IsSuccess.Should().BeTrue();
        resultZero.Value.Items.Any(s => s.Id == studentNoCourses.Id).Should().BeTrue();
        resultZero.Value.Items.Any(s => s.Id == studentWithCourse.Id).Should().BeFalse();

        resultOne.IsSuccess.Should().BeTrue();
        resultOne.Value.Items.Any(s => s.Id == studentWithCourse.Id).Should().BeTrue();
        resultOne.Value.Items.Any(s => s.Id == studentNoCourses.Id).Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WithIsEnrolledInCourseTrue_ShouldReturnEnrolledStudents()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        var enrolledStudent = StudentFactory.CreateStudent(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: $"Enrolled_{Guid.NewGuid()}",
                email: $"student_{Guid.NewGuid()}@example.com")).Value;

        var notEnrolledStudent = StudentFactory.CreateStudent(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: $"NotEnrolled_{Guid.NewGuid()}",
                email: $"student_{Guid.NewGuid()}@example.com")).Value;

        var course = CourseFactory.CreateCourse().Value;
        var enrollment = EnrollmentFactory.CreateEnrollment(studentId: enrolledStudent.Id, courseId: course.Id).Value;

        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertManyAsync([enrolledStudent, notEnrolledStudent]);
            await mongoContext.Courses.InsertOneAsync(course);
            await mongoContext.Enrollments.InsertOneAsync(enrollment);
        }

        var query = new GetAllStudentsQuery(CourseId: course.Id, IsEnrolledInCourse: true);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Any(s => s.Id == enrolledStudent.Id).Should().BeTrue();
        result.Value.Items.Any(s => s.Id == notEnrolledStudent.Id).Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WithIsEnrolledInCourseFalse_ShouldReturnNotEnrolledStudents()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        var enrolledStudent = StudentFactory.CreateStudent(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: $"Enrolled_{Guid.NewGuid()}",
                email: $"student_{Guid.NewGuid()}@example.com")).Value;

        var notEnrolledStudent = StudentFactory.CreateStudent(
            personalInformation: PersonalInformationFactory.CreatePersonalInformation(
                name: $"NotEnrolled_{Guid.NewGuid()}",
                email: $"student_{Guid.NewGuid()}@example.com")).Value;

        var course = CourseFactory.CreateCourse().Value;
        var enrollment = EnrollmentFactory.CreateEnrollment(studentId: enrolledStudent.Id, courseId: course.Id).Value;

        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertManyAsync([enrolledStudent, notEnrolledStudent]);
            await mongoContext.Courses.InsertOneAsync(course);
            await mongoContext.Enrollments.InsertOneAsync(enrollment);
        }

        var query = new GetAllStudentsQuery(CourseId: course.Id, IsEnrolledInCourse: false);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Any(s => s.Id == notEnrolledStudent.Id).Should().BeTrue();
        result.Value.Items.Any(s => s.Id == enrolledStudent.Id).Should().BeFalse();
    }
}
