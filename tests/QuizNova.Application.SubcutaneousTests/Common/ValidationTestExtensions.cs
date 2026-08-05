using System.Linq.Expressions;
using System.Text;

namespace QuizNova.Application.SubcutaneousTests.Common;

public static class ValidationTestExtensions
{
    public static string GetPropertyPath<T>(Expression<Func<T, object?>> expression)
    {
        var body = expression.Body;

        // because we reciving object the value types wrapped into Convert(int) so we need to extract the value type
        if (body is UnaryExpression unary && unary.NodeType == ExpressionType.Convert)
        {
            body = unary.Operand;
        }

        var path = new StringBuilder();
        while (body is MemberExpression member)
        {
            if (path.Length > 0)
            {
                path.Insert(0, ".");
            }

            path.Insert(0, member.Member.Name);
            body = member.Expression;
        }

        return path.ToString();
    }
}
