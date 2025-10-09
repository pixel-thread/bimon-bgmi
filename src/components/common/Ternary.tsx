export const Ternary: React.FC<{
  condition: boolean;
  trueComponent: React.ReactNode;
  falseComponent: React.ReactNode;
}> = ({ condition, trueComponent, falseComponent }) => {
  return condition ? trueComponent : falseComponent;
};
